import { useMemo, useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import "./JobStats.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// CSS 변수 읽기 (스코프 우선)
const readCssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const scope =
    document.querySelector(".jobstats-scope") || document.documentElement;
  const v = getComputedStyle(scope).getPropertyValue(name).trim();
  return v || fallback;
};

// % 라벨 텍스트
const pctText = (v) => {
  const s = (Math.round(v * 10) / 10).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) + "%" : s + "%";
};

// 1~10회 + 10회+
const COUNT_LABELS = Array.from({ length: 10 }, (_, i) => `${i + 1}회`).concat(
  "10회+"
);

// 다양한 소스 → 횟수 분포
function makeCountBins({ distObj, perUserCounts, perUserLists }, maxBin = 10) {
  const bins = Array(maxBin + 1).fill(0);
  if (distObj && typeof distObj === "object") {
    for (const [k, v] of Object.entries(distObj)) {
      const n = parseInt(k, 10);
      const c = Number(v) || 0;
      if (n > maxBin) bins[maxBin] += c;
      else if (n > 0) bins[n - 1] += c;
    }
  } else if (Array.isArray(perUserCounts)) {
    for (const raw of perUserCounts) {
      const n = Number(raw) || 0;
      if (n > maxBin) bins[maxBin] += 1;
      else if (n > 0) bins[n - 1] += 1;
    }
  } else if (Array.isArray(perUserLists)) {
    for (const arr of perUserLists) {
      const n = Array.isArray(arr) ? arr.length : 0;
      if (n > maxBin) bins[maxBin] += 1;
      else if (n > 0) bins[n - 1] += 1;
    }
  }
  return COUNT_LABELS.map((lab, i) => ({ name: lab, count: bins[i] }));
}

// 공통 차트 생성기 (orientation: 'x' 세로막대, 'y' 가로막대)
function buildBarConfig(rows, total, orientation) {
  const surface = readCssVar("--surface-elev", "#fffefc");
  const neutral = readCssVar("--bar-neutral", "#d9d9d9");
  const neutralBorder = readCssVar("--bar-neutral-stroke", "#cfcfcf");
  const accent = readCssVar("--bar-accent", "#6e80ff");
  const accentBorder = readCssVar("--bar-accent-stroke", "#5b6af0");

  const labels = rows.map((r) => r.name);
  const t =
    total > 0 ? total : rows.reduce((s, r) => s + (Number(r.count) || 0), 0);
  const perc = rows.map((r) =>
    t > 0 ? ((Number(r.count) || 0) * 100) / t : 0
  );
  const maxIdx = perc.reduce((mi, v, i) => (v > perc[mi] ? i : mi), 0);
  const backgroundColor = labels.map((_, i) =>
    i === maxIdx ? accent : neutral
  );
  const borderColor = labels.map((_, i) =>
    i === maxIdx ? accentBorder : neutralBorder
  );

  return {
    data: {
      labels,
      datasets: [
        {
          label: "비율(%)",
          data: perc,
          backgroundColor,
          borderColor,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: orientation,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items?.[0]?.label ?? "",
            label: (ctx) =>
              ` ${pctText(
                orientation === "x" ? ctx.parsed.y ?? 0 : ctx.parsed.x ?? 0
              )}`,
          },
        },
      },
      layout: { padding: { top: 12, right: 8, bottom: 0, left: 8 } },
      backgroundColor: surface,
      scales:
        orientation === "x"
          ? {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  callback: (v) => `${v}%`,
                  font: { size: 11 },
                },
                grid: {
                  drawBorder: false,
                  color: readCssVar("--line", "#eee"),
                },
              },
              x: {
                ticks: { font: { size: 11 } },
                grid: { drawBorder: false, display: false },
              },
            }
          : {
              x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  callback: (v) => `${v}%`,
                  font: { size: 11 },
                },
                grid: {
                  drawBorder: false,
                  color: readCssVar("--line", "#eee"),
                },
              },
              y: {
                ticks: { font: { size: 11 }, autoSkip: false },
                grid: { drawBorder: false, display: false },
              },
            },
    },
  };
}

export default function JobStats({
  stats,
  sampleSize = 0,
  jobTitle = "",
  maxItemsPerBlock = 12,
  /** 모달 관련 props */
  asModal = false,
  open = true,
  onClose,
}) {
  // 탭 구성
  const blocks = useMemo(
    () => [
      { key: "activitiesHist", title: "대외활동(횟수)", type: "hist" },
      { key: "awardsHist", title: "수상(횟수)", type: "hist" },
      { key: "certificates", title: "자격증", type: "list" },
      { key: "majors", title: "전공", type: "list" },
      { key: "levels", title: "학력", type: "list" },
    ],
    []
  );

  // 데이터 정규화
  const safe = useMemo(() => {
    const activitiesCountDist = stats?.activitiesCountDist ?? null;
    const awardsCountDist = stats?.awardsCountDist ?? null;

    const perUserActivities =
      stats?.perUser?.activitiesCount ??
      (Array.isArray(stats?.activitiesPerUser)
        ? stats.activitiesPerUser
        : null);
    const perUserAwards =
      stats?.perUser?.awardsCount ??
      (Array.isArray(stats?.awardsPerUser) ? stats.awardsPerUser : null);

    const activitiesHist = makeCountBins({
      distObj: activitiesCountDist,
      perUserCounts:
        Array.isArray(perUserActivities) &&
        typeof perUserActivities[0] !== "object"
          ? perUserActivities
          : null,
      perUserLists:
        Array.isArray(perUserActivities) &&
        typeof perUserActivities[0] === "object"
          ? perUserActivities
          : null,
    });

    const awardsHist = makeCountBins({
      distObj: awardsCountDist,
      perUserCounts:
        Array.isArray(perUserAwards) && typeof perUserAwards[0] !== "object"
          ? perUserAwards
          : null,
      perUserLists:
        Array.isArray(perUserAwards) && typeof perUserAwards[0] === "object"
          ? perUserAwards
          : null,
    });

    return {
      activitiesHist,
      awardsHist,
      certificates: stats?.certificates ?? [],
      majors: stats?.majors ?? [],
      levels: stats?.levels ?? [],
    };
  }, [stats]);

  const [active, setActive] = useState(() => {
    const i = blocks.findIndex((b) =>
      b.type === "hist"
        ? (safe[b.key] || []).some((x) => (x?.count ?? 0) > 0)
        : (safe[b.key] || []).length > 0
    );
    return (i >= 0 ? blocks[i] : blocks[0]).key;
  });

  const activeBlock = useMemo(
    () => blocks.find((b) => b.key === active) ?? blocks[0],
    [blocks, active]
  );

  const listTop = useMemo(() => {
    if (activeBlock.type !== "list") return [];
    const arr = [...(safe[activeBlock.key] || [])].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    );
    return arr.slice(0, maxItemsPerBlock);
  }, [activeBlock, safe, maxItemsPerBlock]);

  // 차트
  const chart = useMemo(() => {
    if (activeBlock.type === "hist") {
      const rows = safe[activeBlock.key] || [];
      if (rows.every((r) => (r?.count ?? 0) === 0)) return null;
      return buildBarConfig(rows, sampleSize, "x");
    }
    if (listTop.length === 0) return null;
    return buildBarConfig(listTop, sampleSize, "y");
  }, [activeBlock, safe, listTop, sampleSize]);

  const hasAny =
    (safe.activitiesHist || []).some((x) => (x?.count ?? 0) > 0) ||
    (safe.awardsHist || []).some((x) => (x?.count ?? 0) > 0) ||
    (safe.certificates || []).length > 0 ||
    (safe.majors || []).length > 0 ||
    (safe.levels || []).length > 0;

  // 모달 동작(ESC 닫기 & 배경 클릭 닫기)
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!asModal || !open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asModal, open, onClose]);

  // 본문(= 모달 헤더 역할)
  const body = (
    <section className="jobstats jobstats--segmented jobstats-scope">
      <div className="jobstats-header">
        <h2 className="jobstats-titleline">
          직무 통계{jobTitle ? ` (${jobTitle})` : ""} · 표본:{" "}
          <b>{sampleSize}</b>명
        </h2>
      </div>

      {/* 탭 */}
      <div className="jobstats-tabs" role="tablist" aria-label="직무 통계 범주">
        {blocks.map((b) => {
          const enabled =
            b.type === "hist"
              ? (safe[b.key] || []).some((x) => (x?.count ?? 0) > 0)
              : (safe[b.key] || []).length > 0;

          return (
            <button
              key={b.key}
              className={`jobstats-tab ${active === b.key ? "is-active" : ""}`}
              onClick={() => enabled && setActive(b.key)}
              disabled={!enabled}
              role="tab"
              aria-selected={active === b.key}
            >
              <span>{b.title}</span>
            </button>
          );
        })}
      </div>

      {/* 그래프 전용 카드 */}
      <div className="jobstats-card jobstats-card--single">
        <div className="jobstats-card-head">
          <h3>{blocks.find((b) => b.key === active)?.title || ""}</h3>
        </div>
        {!hasAny || !chart ? (
          <div className="jobstats-nodata">데이터 없음</div>
        ) : (
          <div className="jobstats-chart-wrap jobstats-chart-wrap--tall">
            <Bar data={chart.data} options={chart.options} />
          </div>
        )}
      </div>
    </section>
  );

  // 모달 래퍼 (상단 오른쪽 X 닫기 버튼 추가)
  if (!asModal) return body;
  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="jobstats-scope jsm-overlay jsm-overlay--center"
      role="dialog"
      aria-modal="true"
      aria-label={`직무 통계${
        jobTitle ? ` (${jobTitle})` : ""
      } · 표본 ${sampleSize}명`}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <section className="jsm-sheet--center">
        <button
          type="button"
          className="jsm-close"
          aria-label="닫기"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="jsm-body">{body}</div>
      </section>
    </div>
  );
}
