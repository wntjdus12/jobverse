import { useNavigate } from "react-router-dom";
import "./PortfolioLanding.css";
import githubLogo from "../assets/githubLogo.png";

export default function PortfolioLanding() {
  const nav = useNavigate();

  return (
    <div className="landing">
      <header className="landing-header">
        <h1>AI로 만들기</h1>
        <p>어떻게 시작하시겠어요?</p>
      </header>

      <section className="card-grid">
        {/* 1. GitHub로 포폴 만들기 */}
        <article className="card" onClick={() => nav("/github")}>
          <div className="thumb thumb-a">
            <img src={githubLogo} alt="GitHub 로고" className="thumb-icon" />
          </div>
          <div className="card-body">
            <h3>GitHub로 포폴 만들기</h3>
            <p>아이디 입력 → 레포 선택 → 자동 생성</p>
            <button className="ghost-btn" type="button">
              시작하기
            </button>
          </div>
        </article>

        {/* 2. 텍스트로 PPT 생성하기 */}
        <article className="card" onClick={() => nav("/ppt-from-text")}>
          <div className="thumb thumb-b">✨</div>
          <div className="card-body">
            <h3>텍스트로 PPT 생성하기</h3>
            <p>프로젝트 내용을 붙여 넣으면 PPT로 변환</p>
            <button className="ghost-btn" type="button">
              시작하기
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
