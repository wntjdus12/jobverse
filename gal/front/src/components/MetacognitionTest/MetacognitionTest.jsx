import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { QUESTIONS } from "./questionsData.js";
import ProgressBar from "./ProgressBar.jsx";
import Question from "./Question.jsx";
import "./MetacognitionTest.css";

/** 토큰 가져오기: localStorage ▶ sessionStorage 순서로 시도 */
function getToken() {
  let t = localStorage.getItem("token") ?? sessionStorage.getItem("token");
  if (!t) return null;
  try {
    if (t.startsWith("{") || t.startsWith('"')) t = JSON.parse(t);
  } catch {}
  return typeof t === "string" ? t.trim() : t;
}

export default function MetacognitionTest() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (questionId, choiceKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceKey }));
    if (currentQ < QUESTIONS.length - 1) setCurrentQ((n) => n + 1);
  };

  useEffect(() => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === QUESTIONS.length) {
      setIsLoading(true);

      const token = getToken();
      if (!token) {
        console.error("토큰이 없습니다. 로그인 후 다시 시도하세요.");
        setIsLoading(false);
        return;
      }

      axios
        .post(
          "http://localhost:8004/api/metacognition/analyze",
          { answers },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
          // 결과 페이지로 이동 + 데이터 전달
          navigate("/metacognition-result", {
            state: { results: res.data },
            replace: true, // 뒤로가기로 재제출 방지(선택)
          });
        })
        .catch((err) => {
          const detail = err?.response?.data || err?.message || err;
          console.error("분석 실패:", detail);
        })
        .finally(() => setIsLoading(false));
    }
  }, [answers, navigate]);

  const progress = (currentQ / QUESTIONS.length) * 100;

  return (
    <div className="test-container">
      {/* 진행바: 로딩 중에는 숨김 */}
      {!isLoading && <ProgressBar progress={progress} />}

      <div className="test-content" aria-hidden={isLoading}>
        {isLoading ? null : (
          <Question
            question={QUESTIONS[currentQ]}
            onAnswer={handleAnswer}
            questionNumber={currentQ + 1}
            totalQuestions={QUESTIONS.length}
          />
        )}
      </div>

      {/* 전체 화면 오버레이 로딩 */}
      {isLoading && (
        <div
          className="loading-overlay"
          role="status"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="loading-spinner" aria-label="분석 중" />
          <p className="loading-text">결과 분석 중입니다...</p>
        </div>
      )}
    </div>
  );
}
