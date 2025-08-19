import { useMemo } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import "./Results.css";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// ✅ 백엔드 스코어 키와 동일한 고정 순서
const CATEGORY_ORDER = [
  "result_oriented",
  "process_oriented",
  "ownership",
  "collaboration",
  "user_centric",
];

export default function Results({
  results,
  aiAdvice,
  categoryLabels,
  onReset,
}) {
  const chartData = useMemo(() => {
    return {
      labels: CATEGORY_ORDER.map((key) => categoryLabels[key]),
      datasets: [
        {
          label: "나의 역량 프로필",
          data: CATEGORY_ORDER.map((key) => results[key] ?? 0),
          backgroundColor: "rgba(37, 99, 235, 0.18)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(37, 99, 235, 1)",
          pointBorderWidth: 1,
        },
      ],
    };
  }, [results, categoryLabels]);

  const sorted = useMemo(() => {
    const arr = CATEGORY_ORDER.map((k) => ({
      key: k,
      label: categoryLabels[k],
      value: results[k] ?? 0,
    })).sort((a, b) => b.value - a.value);
    return arr;
  }, [results, categoryLabels]);

  const top2 = sorted.slice(0, 2);
  const bottom1 = sorted.slice(-1)[0];

  const maxValue = Math.max(...sorted.map((s) => s.value), 1);

  return (
    <div className="mc-report">
      {/* 헤더 */}
      <header className="mc-header">
        {/* <div className="mc-eyebrow">Metacognition Assessment</div> */}
        <h2 className="mc-title">메타인지 진단 결과</h2>
        <p className="mc-subtitle">
          핵심 역량 분포와 AI 코칭 인사이트를 한눈에 확인하세요.
        </p>
      </header>

      {/* KPI 카드 */}
      <section className="mc-kpis">
        <div className="mc-card">
          <div className="mc-card-title">강점 Top 2</div>
          <ul className="mc-list">
            {top2.map((s) => (
              <li key={s.key} className="mc-list-item">
                <span className="mc-bullet mc-bullet--strong" />
                <span className="mc-list-text">
                  {s.label}
                  <span className="mc-score">{s.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mc-card">
          <div className="mc-card-title">보완 1순위</div>
          <div className="mc-bottom-one">
            <span className="mc-bullet mc-bullet--weak" />
            <span className="mc-list-text">
              {bottom1?.label}
              <span className="mc-score">{bottom1?.value}</span>
            </span>
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card-title">전체 평균</div>
          <div className="mc-avg">
            {(
              sorted.reduce((sum, s) => sum + s.value, 0) / sorted.length
            ).toFixed(1)}
          </div>
        </div>
      </section>

      {/* 차트 & 막대 요약 */}
      <section className="mc-grid">
        <div className="mc-panel">
          <div className="mc-panel-head">
            <h3 className="mc-panel-title">역량 레이더</h3>
          </div>
          <div className="mc-chart-wrap">
            <Radar
              data={chartData}
              options={{
                responsive: true,
                scales: {
                  r: {
                    suggestedMin: 0,
                    ticks: { stepSize: 1 },
                    grid: { circular: true },
                    angleLines: { color: "rgba(0,0,0,0.08)" },
                  },
                },
                plugins: {
                  legend: { display: true, position: "top" },
                },
              }}
            />
          </div>
        </div>

        <div className="mc-panel">
          <div className="mc-panel-head">
            <h3 className="mc-panel-title">카테고리별 지표</h3>
          </div>
          <div className="mc-bars">
            {sorted.map((s) => {
              const ratio = Math.max(0, Math.min(1, s.value / maxValue));
              return (
                <div key={s.key} className="mc-bar-row">
                  <div className="mc-bar-label">{s.label}</div>
                  <div className="mc-bar-track">
                    <div
                      className="mc-bar-fill"
                      style={{ width: `${ratio * 100}%` }}
                      aria-valuenow={s.value}
                      aria-valuemin={0}
                      aria-valuemax={maxValue}
                    />
                  </div>
                  <div className="mc-bar-value">{s.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI 인사이트 */}
      {aiAdvice && (
        <section className="mc-insight">
          <div className="mc-panel-head">
            <h3 className="mc-panel-title">AI 코칭 인사이트</h3>
          </div>
          <pre className="mc-advice">{aiAdvice}</pre>
          <div className="mc-hint">
            이 인사이트는 테스트 결과를 바탕으로 생성된 요약입니다.
          </div>
        </section>
      )}

      {/* 액션 */}
      <footer className="mc-actions">
        <button className="mc-btn" onClick={onReset}>
          다시 테스트하기
        </button>
      </footer>
    </div>
  );
}
