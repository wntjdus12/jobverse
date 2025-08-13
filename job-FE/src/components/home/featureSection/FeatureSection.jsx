// FeatureSection.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserTie, FaPaintBrush, FaFileSignature, FaChalkboardTeacher, FaBuilding, FaUsers } from 'react-icons/fa';
import './FeatureSection.css';

const features = [
  // ... (features 배열 데이터는 이전과 동일)
  { id: 'ai-mentor', icon: <FaUserTie />, title: 'AI 직무 영상', description: 'AI 아바타가 각 직무의 핵심 역량과 전망을 생생한 영상으로 소개해 드립니다. 궁금한 점은 무엇이든 물어보세요.', image: '/images/feature-ai-mentor.jpg', },
  { id: 'portfolio-clinic', icon: <FaPaintBrush />, title: 'AI 포트폴리오 분석', description: '당신의 포트폴리오를 업로드하세요. 수만 건의 데이터를 학습한 AI가 강점과 약점을 분석하고, 합격률을 높이는 개선점을 찾아드립니다.', image: '/images/feature-portfolio.jpg', },
  { id: 'resume-feedback', icon: <FaFileSignature />, title: 'AI 자기소개서 첨삭', description: '직무별 핵심 키워드와 합격 자소서 패턴을 분석하여, 당신만의 스토리를 담은 매력적인 글로 완성해 드립니다.', image: '/images/feature-resume.jpg', },
  { id: 'virtual-interview', icon: <FaChalkboardTeacher />, title: '가상 면접 시뮬레이션', description: '실제와 같은 가상 면접 환경에서 AI 면접관과 함께 실전처럼 연습하세요. 시선 처리, 답변 속도, 음성 톤까지 분석하여 종합 피드백을 제공합니다.', image: '/images/feature-interview.jpg', },
  { id: 'networking-lounge', icon: <FaUsers />, title: '네트워킹 라운지', description: '관심 직무의 현직자, 그리고 같은 꿈을 꾸는 동료들과 자유롭게 소통하고 정보를 교환하는 메타버스 네트워킹 공간입니다.', image: '/images/feature-networking.jpg', },
];

const FeatureSection = () => {
  const [activeImage, setActiveImage] = useState(features[0].image);

  return (
    <section className="feature-section">
      {/* [수정] 헤더 텍스트를 섹션의 최상단으로 이동시켰습니다. */}
      <div className="section-top-header">
        <h3>JOBVERSE, 새로운 차원의 직업 박람회</h3>
        <p>
          AI 기술과 메타버스가 결합된 JOBVERSE에서 당신의 커리어 잠재력을 최대한으로 끌어올리세요. 단순한 정보 탐색을 넘어, 실제적인 체험과 성장을 지원합니다.
        </p>
      </div>

      <div className="feature-container">
        <div className="left-sticky-pane">
          <div className="feature-image-wrapper">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt="Feature visual"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          </div>
        </div>
        
        {/* [수정] 오른쪽 스크롤 영역에서는 헤더 텍스트가 제거되었습니다. */}
        <div className="right-scroll-pane">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              className="feature-item"
              onViewportEnter={() => setActiveImage(feature.image)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-text">
                <h4 className="feature-title">{feature.title} &rarr;</h4>
                <p className="feature-description">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;