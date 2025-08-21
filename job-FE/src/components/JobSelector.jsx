import React from "react";
import { motion } from "framer-motion"; // Framer Motion import 추가
import {
  FaLaptopCode,
  FaBullhorn,
  FaBuilding,
  FaIndustry,
} from "react-icons/fa6"; // 아이콘을 더 세련된 것으로 교체
import "./JobSelector.css";

const jobCategories = {
  // 아이콘을 추가하여 시각적 구분 강화
  개발: {
    icon: <FaLaptopCode />,
    jobs: [
      { key: "backend", label: "백엔드 개발자" },
      { key: "frontend", label: "프론트엔드 개발자" },
      { key: "ai", label: "AI/데이터 개발자" },
      { key: "devops", label: "DevOps/인프라 개발자" },
    ],
  },
  마케팅: {
    icon: <FaBullhorn />,
    jobs: [
      { key: "digital", label: "디지털 마케터" },
      { key: "content", label: "콘텐츠 마케터" },
      { key: "performance", label: "퍼포먼스 마케터" },
      { key: "planning", label: "마케팅 기획자" },
    ],
  },
  경영: {
    icon: <FaBuilding />,
    jobs: [
      { key: "finance", label: "재무/회계" },
      { key: "product", label: "프로덕트 매니저" },
      { key: "business", label: "사업기획자" },
      { key: "hr", label: "HR 담당자" },
    ],
  },
  생산: {
    icon: <FaIndustry />,
    jobs: [
      { key: "worker", label: "생산직" },
      { key: "quality", label: "품질보증" },
      { key: "manager", label: "생산관리자" },
      { key: "engineer", label: "설비 유지보수 엔지니어" },
    ],
  },
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const JobSelector = ({ onSelect }) => {
  return (
    <motion.div
      className="job-selector-popup"
      variants={popupVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <h3>어떤 직무가 궁금하신가요?</h3>
      {Object.entries(jobCategories).map(([category, { icon, jobs }]) => (
        <div key={category} className="job-category">
          <h4 className="category">
            <span className="category-icon">{icon}</span> {category}
          </h4>
          <div className="job-list">
            {jobs.map(({ key, label }) => (
              <motion.button
                key={key}
                className="job-button"
                onClick={() => onSelect(category, key, label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default JobSelector;
