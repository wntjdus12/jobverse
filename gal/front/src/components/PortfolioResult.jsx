import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Doughnut } from "react-chartjs-2";

import "./PortfolioResult.css";

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsl(${(i * 360) / count}, 65%, 65%)`);
  }
  return colors;
}

function RepoCard({ username, repo }) {
  const [languages, setLanguages] = useState({});
  const [contrib, setContrib] = useState({
    my_commit: 0,
    total_commit: 0,
    contribution_percent: 0,
  });
  const [summary, setSummary] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:8004/repos/${username}/${repo.name}/languages`)
      .then((res) => setLanguages(res.data));
    axios
      .get(
        `http://localhost:8004/repos/${username}/${repo.name}/contributions/${username}`
      )
      .then((res) => setContrib(res.data));
    axios
      .get(`http://localhost:8004/repos/${username}/${repo.name}/readme`)
      .then((readmeRes) => {
        axios
          .post("http://localhost:8004/openai-summary/", {
            readme: readmeRes.data.readme_markdown,
            github_url: `https://github.com/${username}/${repo.name}`,
          })
          .then((aiRes) => setSummary(aiRes.data.summary));
      });
  }, [username, repo.name]);

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
          {summary || "요약 로딩 중..."}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function PortfolioResult() {
  const location = useLocation();
  const username = location.state?.username ?? "";
  const selectedRepos = location.state?.selectedRepos ?? [];

  const [languagesData, setLanguagesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    Promise.all(
      selectedRepos.map((repo) =>
        axios
          .get(`http://localhost:8004/repos/${username}/${repo.name}/languages`)
          .then((res) => res.data)
          .catch(() => ({}))
      )
    ).then((results) => {
      const aggregated = {};
      results.forEach((langObj) => {
        for (const [lang, value] of Object.entries(langObj)) {
          aggregated[lang] = (aggregated[lang] || 0) + value;
        }
      });
      setLanguagesData(aggregated);
      setLoading(false);
    });
  }, [username, selectedRepos]);

  if (loading) return <div className="loading">로딩 중...</div>;
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
          {Object.keys(languagesData).length === 0 ? (
            <p>언어 정보 없음</p>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(languagesData),
                datasets: [
                  {
                    data: Object.values(languagesData),
                    backgroundColor: generateColors(
                      Object.keys(languagesData).length
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
          {selectedRepos
            .slice()
            .sort(
              (a, b) =>
                new Date(b.pushed_at).getTime() -
                new Date(a.pushed_at).getTime()
            )
            .map((repo) => (
              <RepoCard key={repo.id} username={username} repo={repo} />
            ))}
        </main>
      </div>
    </div>
  );
}
