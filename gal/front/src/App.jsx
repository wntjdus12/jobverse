import GithubRepo from "./components/GithubRepo";
import PortfolioResult from "./components/PortfolioResult";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GithubRepo />} />
          <Route path="/portfolio-result" element={<PortfolioResult />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
