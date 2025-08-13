// CardNewsSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './CardNewsSection.css';
import { FaGoogle, FaSlack, FaTrello, FaFigma } from 'react-icons/fa';

// 등장 애니메이션 설정
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // 자식 요소(제목, 카드 그리드)가 순차적으로 등장
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const CardNewsSection = () => {
  return (
    <motion.section 
      className="card-news-section-new"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="card-news-container-new">

        {/* 메인 제목 */}
        <motion.h2 variants={itemVariants} className="section-title-new">
          AI 직무 시뮬레이션
        </motion.h2>

        <motion.div variants={itemVariants} className="card-grid">
          
          {/* 왼쪽 카드 */}
          <motion.div 
            className="info-card left-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="left-card-content">
              <div className="left-card-text">
                {/* [문구 수정] */}
                <h3>데이터 기반 커리어 설계</h3>
                <p>
                  수백만 건의 직무 데이터를 학습한 AI가 당신의 성향과 역량을 분석하여 최적의 커리어 패스를 설계하고, 맞춤형 시뮬레이션을 제공합니다.
                </p>
              </div>
              <div className="logo-grid-wrapper">
                {/* [문구 수정] */}
                <h4 className="logo-grid-title">주요 시뮬레이션 직군</h4>
                <div className="logo-grid">
                  <FaGoogle size={30} />
                  <FaSlack size={30} />
                  <FaTrello size={30} />
                  <FaFigma size={30} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 오른쪽 카드 */}
          <motion.div 
            className="info-card right-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="right-card-image-container">
              {/* [이미지 교체 제안] 이 카드에는 '가상 면접' 이미지가 더 어울릴 수 있습니다. */}
              <img src="/images/feature-interview.jpg" alt="AI Job Simulation" />
            </div>
            <div className="right-card-content">
              {/* [문구 수정] */}
              <h3>시뮬레이션 라이브러리</h3>
              <p>개발자, 마케터, 디자이너 등 가장 인기있는 직무의 하루를 직접 살아보고, 예상치 못한 문제들을 해결하며 직무 적합도를 확인해보세요.</p>
              <div className="resource-links">
                <a href="#">개발자 시뮬레이션 &rarr;</a>
                <a href="#">마케터 시뮬레이션 &rarr;</a>
                <a href="#">디자이너 시뮬레이션 &rarr;</a>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </motion.section>
  );
};

export default CardNewsSection;