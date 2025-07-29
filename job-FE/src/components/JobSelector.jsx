// JobSelector.jsx
import React from "react";
import "./JobSelector.css";

const jobCategories = {
  개발: [
    { key: "backend", label: "백엔드 개발자" },
    { key: "frontend", label: "프론트엔드 개발자" },
    { key: "ai", label: "AI/데이터 개발자" },
    { key: "devops", label: "DevOps/인프라 개발자" },
  ],
  마케팅: [
    { key: "digital", label: "디지털 마케터" },
    { key: "content", label: "콘텐츠 마케터" },
    { key: "performance", label: "퍼포먼스 마케터" },
    { key: "planning", label: "마케팅 기획자" },
  ],
  경영: [
    { key: "finance", label: "재무/회계" },
    { key: "product", label: "프로덕트 매니저" },
    { key: "business", label: "사업기획자" },
    { key: "hr", label: "HR 담당자" },
  ],
  생산: [
    { key: "worker", label: "생산직" },
    { key: "quality", label: "품질보증" },
    { key: "manager", label: "생산관리자" },
    { key: "engineer", label: "설비 유지보수 엔지니어" },
  ],
};

const JobSelector = ({ onSelect }) => {
  return (
    <div className="job-selector-popup">
      <h3>어떤 직무가 궁금하신가요?</h3>
      {Object.entries(jobCategories).map(([category, jobs]) => (
        <div key={category} className="job-category">
          <h4 className="category">🫟 {category}</h4>
          <div className="job-list">
            {jobs.map(({ key, label }) => (
              <button
                key={key}
                className="job-button"
                onClick={() => onSelect(category, key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobSelector;
