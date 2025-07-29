import { useParams } from "react-router-dom";

const JobPage = () => {
  const { jobId } = useParams();

  return (
    <div style={{ padding: "3rem" }}>
      <h1>{jobId.toUpperCase()} 직무 페이지</h1>
      <p>여기에 {jobId} 관련 정보가 들어갑니다.</p>
    </div>
  );
};

export default JobPage;