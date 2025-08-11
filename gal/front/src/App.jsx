import GithubRepo from "./components/GithubRepo";
import PortfolioLanding from "./components/PortfolioLanding";
import PortfolioResult from "./components/PortfolioResult";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/github" element={<GithubRepo />} />
          <Route path="/portfolio-landing" element={<PortfolioLanding />} />
          <Route path="/portfolio-result" element={<PortfolioResult />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
