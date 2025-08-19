// src/components/page/MetacognitionResultPage.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Results from "../components/MetacognitionTest/Results.jsx";
import { CATEGORY_LABELS } from "../components/MetacognitionTest/questionsData.js";

export default function MetacognitionResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const resultsData = state?.results;

  // 직접 URL로 들어온 경우 가드
  useEffect(() => {
    if (!resultsData) {
      navigate("/metacognition-test", { replace: true });
    }
  }, [resultsData, navigate]);

  if (!resultsData) return null;

  return (
    <div>
      <Results
        results={resultsData.scores}
        aiAdvice={resultsData.ai_advice}
        categoryLabels={CATEGORY_LABELS}
        onReset={() => navigate("/metacognition-test")}
      />
    </div>
  );
}
