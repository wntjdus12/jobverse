import GithubRepo from "./components/GithubRepo";
import PortfolioLanding from "./components/PortfolioLanding";
import PortfolioResult from "./components/PortfolioResult";
import MetacognitionTestPage from "./page/MetacognitionTestPage";
import MetacognitionResultPage from "./page/MetacognitionResultPage";
import ResumePage from "./page/ResumePage";
import JobStatsPage from "./page/JobStatsPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/github" element={<GithubRepo />} />
          <Route path="/document-landing" element={<PortfolioLanding />} />
          <Route path="/portfolio-result" element={<PortfolioResult />} />
          <Route
            path="/metacognition-test"
            element={<MetacognitionTestPage />}
          />{" "}
          <Route
            path="/metacognition-result"
            element={<MetacognitionResultPage />}
          />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/job-stats" element={<JobStatsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
