import { useLocation, useNavigate } from "react-router-dom";
import JobStats from "../components/Resume/JobStats";

export default function JobStatsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { stats, sampleSize, jobTitle } = location.state || {};

  if (!stats) {
    return (
      <div style={{ padding: 24 }}>
        <h1>통계 데이터가 없습니다</h1>
        <p>이력서를 먼저 제출해 주세요.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate(-1)}>{`←`}</button>
        <h1 style={{ margin: 0 }}>직무 통계 결과</h1>
      </div>
      <JobStats stats={stats} sampleSize={sampleSize} jobTitle={jobTitle} />
    </div>
  );
}
