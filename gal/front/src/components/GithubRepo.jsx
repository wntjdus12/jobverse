import { useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import DOMPurify from "dompurify";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";

import "./GithubRepo.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);
Modal.setAppElement("#root");

function Tag({ text }) {
  return <span className="tag">{text}</span>;
}

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsl(${(i * 360) / Math.max(1, count)}, 65%, 65%)`);
  }
  return colors;
}

export default function GithubRepo() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [languagesData, setLanguagesData] = useState({});
  const [portfolioCreated, setPortfolioCreated] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRepo, setModalRepo] = useState(null);
  const [modalReadmeHtml, setModalReadmeHtml] = useState("");

  const fetchRepos = async () => {
    if (!username) return alert("GitHub 아이디를 입력하세요.");
    try {
      const res = await axios.get(`http://localhost:8004/repos/${username}`);
      setRepos(res.data);
      setSelectedRepos([]);
      setLanguagesData({});
      setPortfolioCreated(false);
    } catch {
      alert("저장소를 불러오지 못했습니다. 아이디를 다시 확인해 주세요.");
      setRepos([]);
    }
  };

  const openRepoModal = async (repo) => {
    setModalRepo(repo);
    setModalOpen(true);
    try {
      const res = await axios.get(
        `http://localhost:8004/repos/${username}/${repo.name}/readme`
      );
      setModalReadmeHtml(DOMPurify.sanitize(res.data.readme_html || ""));
    } catch {
      setModalReadmeHtml("<p>README를 불러올 수 없습니다.</p>");
    }
  };

  const toggleSelectRepo = (repo) => {
    if (selectedRepos.some((r) => r.id === repo.id)) {
      setSelectedRepos(selectedRepos.filter((r) => r.id !== repo.id));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }
  };

  const calculateLanguages = async () => {
    const langAggregate = {};
    for (const repo of selectedRepos) {
      try {
        const res = await axios.get(
          `http://localhost:8004/repos/${username}/${repo.name}/languages`
        );
        for (const [lang, bytes] of Object.entries(res.data || {})) {
          langAggregate[lang] = (langAggregate[lang] || 0) + bytes;
        }
      } catch {
        // ignore single repo error
      }
    }
    setLanguagesData(langAggregate);
  };

  const createPortfolio = async () => {
    await calculateLanguages();
    setPortfolioCreated(true);
    navigate("/portfolio-result", { state: { username, selectedRepos } });
  };

  return (
    <div className="gh-container">
      <div className="gh-inner">
        <header className="gh-header">
          <div>
            <h1 className="gh-title">GitHub 기반 포트폴리오 생성기</h1>
            <p className="gh-subtitle">
              아이디 입력 → 저장소 선택 → 포폴 카드 & 기술스택 요약
            </p>
          </div>

          <div className="gh-search">
            <input
              className="input"
              type="text"
              placeholder="GitHub 아이디 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && fetchRepos()}
            />
            <button className="btn btn-primary" onClick={fetchRepos}>
              저장소 불러오기
            </button>
          </div>
        </header>

        {repos.length > 0 && !portfolioCreated && (
          <>
            <h2 className="section-title">저장소 목록</h2>
            <p className="section-help">
              카드를 클릭하면 README를 미리볼 수 있어요.
            </p>

            <div className="repo-grid">
              {repos.map((repo) => {
                const selected = selectedRepos.find((r) => r.id === repo.id);
                return (
                  <article
                    key={repo.id}
                    className={`repo-card ${selected ? "is-selected" : ""}`}
                  >
                    <div
                      className="repo-title"
                      onClick={() => openRepoModal(repo)}
                      title="클릭하여 상세 README 열기"
                    >
                      {repo.name}
                    </div>
                    <div className="repo-meta">
                      {repo.language && <Tag text={repo.language} />}
                      {repo.private && <Tag text="Private" />}
                    </div>
                    <p className="repo-desc">
                      {repo.description || "설명 없음"}
                    </p>

                    <div className="repo-actions">
                      <button
                        className={`btn ${
                          selected ? "btn-danger" : "btn-success"
                        }`}
                        onClick={() => toggleSelectRepo(repo)}
                      >
                        {selected ? "포폴에서 제거" : "포폴에 추가"}
                      </button>
                      {/* <a
                        className="btn btn-ghost"
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        title="GitHub에서 열기"
                      >
                        GitHub
                      </a> */}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="footer-actions">
              <button
                onClick={createPortfolio}
                disabled={selectedRepos.length === 0}
                className={`btn btn-lg ${
                  selectedRepos.length === 0 ? "btn-disabled" : "btn-primary"
                }`}
                title={
                  selectedRepos.length === 0
                    ? "저장소를 하나 이상 선택하세요"
                    : "선택한 저장소로 포폴 만들기"
                }
              >
                포트폴리오 만들기
              </button>
            </div>
          </>
        )}

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          {modalRepo && (
            <>
              <div className="modal-header">
                <h2>{modalRepo.name}</h2>
                <button
                  className="btn btn-ghost"
                  onClick={() => setModalOpen(false)}
                >
                  닫기
                </button>
              </div>

              <div className="repo-meta modal-meta">
                {modalRepo.language && <Tag text={modalRepo.language} />}
                {modalRepo.private && <Tag text="Private" />}
              </div>

              <p className="repo-desc modal-desc">
                <b>설명:</b> {modalRepo.description || "없음"}
              </p>

              <h3 className="modal-subtitle">README</h3>
              <div
                className="readme-box"
                dangerouslySetInnerHTML={{ __html: modalReadmeHtml }}
              />
            </>
          )}
        </Modal>

        {portfolioCreated && (
          <aside className="summary-panel">
            <h2 className="summary-title">{username}의 포트폴리오</h2>
            <p className="summary-link">
              GitHub:&nbsp;
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/{username}
              </a>
            </p>

            <h3 className="summary-subtitle">기술 스택 (사용 언어)</h3>
            {Object.keys(languagesData).length === 0 ? (
              <p className="muted">선택한 프로젝트에 언어 정보가 없습니다</p>
            ) : (
              <div className="chart-wrap">
                <Doughnut
                  key={Object.keys(languagesData).join(",")}
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
                  options={{
                    plugins: { legend: { position: "bottom" } },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
