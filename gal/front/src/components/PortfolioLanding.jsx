import { useNavigate } from "react-router-dom";
import "./PortfolioLanding.css";
import githubLogo from "../assets/githubLogo.png";
import resumeLogo from "../assets/resume.png";
import brainLogo from "../assets/mindset.png";

export default function PortfolioLanding() {
  const nav = useNavigate();

  return (
    <div className="landing">
      <header className="landing-header">
        <h1>AI로 시작하기</h1>
        <p>AI를 활용해 서류를 완성해보세요!</p>
      </header>

      <section className="card-grid">
        {/* ai 이력서 첨삭 */}
        <article className="card" onClick={() => nav("/resume")}>
          <div className="thumb thumb-c">
            <img
              src={resumeLogo}
              alt="이력서 로고"
              className="thumb-icon resume-icon"
            />
          </div>
          <div className="card-body">
            <h3>이력서 통계</h3>
            <p>이력서를 업로드하고 데이터를 확인하기</p>
            <button className="ghost-btn" type="button">
              시작하기
            </button>
          </div>
        </article>

        <article className="card" onClick={() => nav("/metacognition-test")}>
          <div className="thumb thumb-b">
            <img
              src={brainLogo}
              alt="이력서 로고"
              className="thumb-icon resume-icon"
            />
          </div>
          <div className="card-body">
            <h3>메타인지 테스트</h3>
            <p>자소서 작성을 위한 메타인지 테스트하기</p>
            <button className="ghost-btn" type="button">
              시작하기
            </button>
          </div>
        </article>
        {/* 1. GitHub로 포폴 만들기 */}
        <article className="card" onClick={() => nav("/github")}>
          <div className="thumb thumb-a">
            <img
              src={githubLogo}
              alt="GitHub 로고"
              className="thumb-icon github-icon"
            />
          </div>
          <div className="card-body">
            <h3>GitHub로 포폴 생성</h3>
            <p>아이디 입력 → 레포 선택 → 자동 생성</p>
            <button className="ghost-btn" type="button">
              시작하기
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
