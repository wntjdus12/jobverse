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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);
Modal.setAppElement("#root");

function Tag({ text }) {
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: "#e1e1e1",
        borderRadius: 12,
        padding: "2px 10px",
        fontSize: 12,
        color: "#555",
        marginRight: 6,
        userSelect: "none",
      }}
    >
      {text}
    </span>
  );
}

function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsl(${(i * 360) / count}, 65%, 65%)`);
  }
  return colors;
}

function GithubRepo() {
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
      setModalReadmeHtml(DOMPurify.sanitize(res.data.readme_html));
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
      } catch {}
    }
    setLanguagesData(langAggregate);
  };

  const createPortfolio = async () => {
    await calculateLanguages();
    setPortfolioCreated(true);
    navigate("/portfolio-result", { state: { username, selectedRepos } });
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "auto",
        padding: 20,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h1>GitHub 기반 포트폴리오 생성기</h1>

      <input
        type="text"
        placeholder="GitHub 아이디 입력"
        value={username}
        onChange={(e) => setUsername(e.target.value.trim())}
        style={{ padding: 8, fontSize: 16, width: 250, marginRight: 10 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") fetchRepos();
        }}
      />
      <button
        onClick={fetchRepos}
        style={{ padding: "8px 16px", fontSize: 16 }}
      >
        저장소 불러오기
      </button>

      {repos.length > 0 && !portfolioCreated && (
        <>
          <h2 style={{ marginTop: 30 }}>저장소 목록 (클릭 시 상세 README)</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {repos.map((repo) => (
              <div
                key={repo.id}
                style={{
                  border: selectedRepos.find((r) => r.id === repo.id)
                    ? "2px solid #007bff"
                    : "1px solid #ccc",
                  borderRadius: 8,
                  padding: 12,
                  width: 280,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  cursor: "default",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    onClick={() => openRepoModal(repo)}
                    style={{
                      marginBottom: 6,
                      color: "#007bff",
                      cursor: "pointer",
                    }}
                    title="클릭하여 상세 README 열기"
                  >
                    {repo.name}
                  </h3>
                  <div style={{ marginBottom: 8 }}>
                    {repo.language && <Tag text={repo.language} />}
                  </div>
                  <p style={{ fontSize: 14, minHeight: 48, color: "#333" }}>
                    {repo.description || "설명 없음"}
                  </p>
                </div>
                <button
                  onClick={() => toggleSelectRepo(repo)}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 10,
                    padding: "6px 12px",
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: selectedRepos.find((r) => r.id === repo.id)
                      ? "#dc3545"
                      : "#28a745",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {selectedRepos.find((r) => r.id === repo.id)
                    ? "포폴에서 제거"
                    : "포폴에 추가"}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={createPortfolio}
            disabled={selectedRepos.length === 0}
            style={{
              marginTop: 30,
              padding: "12px 24px",
              fontSize: 18,
              cursor: selectedRepos.length === 0 ? "not-allowed" : "pointer",
              backgroundColor: selectedRepos.length === 0 ? "#999" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
            }}
          >
            포트폴리오 만들기
          </button>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        style={{
          content: {
            maxWidth: 700,
            margin: "auto",
            height: "70vh",
            overflowY: "auto",
            padding: 20,
          },
        }}
      >
        {modalRepo && (
          <>
            <h2>{modalRepo.name}</h2>
            <div style={{ marginBottom: 12 }}>
              {modalRepo.language && <Tag text={modalRepo.language} />}
            </div>
            <p>
              <b>설명:</b> {modalRepo.description || "없음"}
            </p>
            <h3>README</h3>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: 15,
                backgroundColor: "#f9f9f9",
                maxHeight: "50vh",
                overflowY: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: modalReadmeHtml }}
            />
            <button
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: 20,
                padding: "8px 18px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
          </>
        )}
      </Modal>

      {portfolioCreated && (
        <aside
          style={{
            marginTop: 40,
            width: 280,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 0 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2>{username}의 포트폴리오</h2>
          <p>
            GitHub:{" "}
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#007bff" }}
            >
              https://github.com/{username}
            </a>
          </p>
          <h3>기술 스택 (사용 언어)</h3>
          {Object.keys(languagesData).length === 0 ? (
            <p>선택한 프로젝트에 언어 정보가 없습니다</p>
          ) : (
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
              options={{ plugins: { legend: { position: "bottom" } } }}
              height={250}
              width={250}
            />
          )}
        </aside>
      )}
    </div>
  );
}

export default GithubRepo;
