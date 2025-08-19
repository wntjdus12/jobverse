import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Doughnut } from "react-chartjs-2";

import { SkeletonHeader, SkeletonSidebar, SkeletonRepoCard } from "./Skeletons";
import "./PortfolioResult.css";

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < Math.max(1, count); i++) {
    colors.push(`hsl(${(i * 360) / Math.max(1, count)}, 65%, 65%)`);
  }
  return colors;
}

/* ------- 순수 표시용 카드 (fetch 없음) ------- */
function RepoCard({ repo, bundle }) {
  const { languages, contrib, summary } = bundle || {
    languages: {},
    contrib: { my_commit: 0, total_commit: 0, contribution_percent: 0 },
    summary: "",
  };

  return (
    <div className="repo-card">
      <div className="repo-header">
        <h3>{repo.name}</h3>
        <span className="repo-date">
          {new Date(repo.pushed_at).toLocaleDateString()}
        </span>
      </div>

      <p className="repo-description">{repo.description || "No description"}</p>

      <div className="repo-langs">
        {Object.keys(languages).length === 0 ? (
          <span className="lang-badge empty">No language</span>
        ) : (
          Object.keys(languages).map((lang) => (
            <span key={lang} className="lang-badge">
              {lang}
            </span>
          ))
        )}
      </div>

      <div className="repo-contrib">
        <div className="contrib-info">
          <span>내 기여도</span>
          <span>
            {contrib.my_commit}/{contrib.total_commit} (
            {contrib.contribution_percent}%)
          </span>
        </div>
        <div className="contrib-bar-bg">
          <div
            className="contrib-bar-fg"
            style={{ width: `${contrib.contribution_percent}%` }}
          />
        </div>
      </div>

      <div className="repo-summary">
        <h4>📌 프로젝트 요약</h4>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {summary || "요약을 불러오지 못했습니다."}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/* ------- 페이지 ------- */
export default function PortfolioResult() {
  const location = useLocation();
  const username = location.state?.username ?? "";
  const selectedRepos = location.state?.selectedRepos ?? [];

  const [languagesAgg, setLanguagesAgg] = useState({});
  const [bundles, setBundles] = useState({}); // repo.id → {languages, contrib, summary}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 최신 push 순으로 정렬 (표시 순서 고정)
  const sortedRepos = useMemo(
    () =>
      (selectedRepos || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
        ),
    [selectedRepos]
  );

  useEffect(() => {
    if (
      !username ||
      !Array.isArray(selectedRepos) ||
      selectedRepos.length === 0
    ) {
      setError("유효하지 않은 접근입니다.");
      setLoading(false);
      return;
    }

    // 각 저장소 번들 로드
    const fetchBundle = async (repo) => {
      try {
        const [langs, contrib, readme] = await Promise.all([
          axios
            .get(
              `http://localhost:8004/api/portfolio/repos/${username}/${repo.name}/languages`
            )
            .then((r) => r.data)
            .catch(() => ({})),
          axios
            .get(
              `http://localhost:8004/api/portfolio/repos/${username}/${repo.name}/contributions/${username}`
            )
            .then((r) => r.data)
            .catch(() => ({
              my_commit: 0,
              total_commit: 0,
              contribution_percent: 0,
            })),
          axios
            .get(
              `http://localhost:8004/api/portfolio/repos/${username}/${repo.name}/readme`
            )
            .then((r) => r.data?.readme_markdown || "")
            .catch(() => ""),
        ]);

        const summary = readme
          ? await axios
              .post("http://localhost:8004/api/portfolio/openai-summary/", {
                readme,
                github_url: `https://github.com/${username}/${repo.name}`,
              })
              .then((r) => r.data.summary)
              .catch(() => "요약을 불러오지 못했습니다.")
          : "리드미에 내용이 없습니다.";

        return { repoId: repo.id, languages: langs, contrib, summary };
      } catch {
        return {
          repoId: repo.id,
          languages: {},
          contrib: { my_commit: 0, total_commit: 0, contribution_percent: 0 },
          summary: "요약을 불러오지 못했습니다.",
        };
      }
    };

    (async () => {
      try {
        // 모든 저장소에 대해 번들 동시 로딩
        const allBundles = await Promise.all(sortedRepos.map(fetchBundle));
        // 상태 저장: id → 번들
        const nextBundles = {};
        const agg = {};
        for (const b of allBundles) {
          nextBundles[b.repoId] = {
            languages: b.languages,
            contrib: b.contrib,
            summary: b.summary,
          };
          // 언어 집계
          Object.entries(b.languages || {}).forEach(([lang, val]) => {
            agg[lang] = (agg[lang] || 0) + val;
          });
        }
        setBundles(nextBundles);
        setLanguagesAgg(agg);
        setLoading(false); // ✅ 전부 완료되면 한 번에 화면 전환
      } catch (e) {
        setError("데이터를 불러오지 못했습니다.");
        setLoading(false);
      }
    })();
  }, [username, sortedRepos]);

  if (loading) {
    // ✅ 전부 로딩 완료될 때까지 스켈레톤만 표시
    return (
      <div className="portfolio-wrapper">
        <SkeletonHeader />
        <div className="portfolio-body">
          <SkeletonSidebar />
          <main className="portfolio-main">
            {sortedRepos.length === 0
              ? [1, 2, 3].map((i) => <SkeletonRepoCard key={i} />)
              : sortedRepos.map((r) => <SkeletonRepoCard key={r.id} />)}
          </main>
        </div>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="portfolio-wrapper">
      <header className="portfolio-header">
        <h1>{username} 님의 포트폴리오</h1>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noreferrer"
        >
          github.com/{username}
        </a>
      </header>

      <div className="portfolio-body">
        <aside className="portfolio-sidebar">
          <h2>기술 스택</h2>
          {Object.keys(languagesAgg).length === 0 ? (
            <p>언어 정보 없음</p>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(languagesAgg),
                datasets: [
                  {
                    data: Object.values(languagesAgg),
                    backgroundColor: generateColors(
                      Object.keys(languagesAgg).length
                    ),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom" } } }}
              height={250}
              width={250}
            />
          )}
        </aside>

        <main className="portfolio-main">
          {sortedRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} bundle={bundles[repo.id]} />
          ))}
        </main>
      </div>
    </div>
  );
}
