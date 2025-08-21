// FeatureSection.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { FaUserTie, FaPaintBrush, FaFileSignature, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';
import './FeatureSection.css';

const features = [
  { id: 'ai-mentor', icon: <FaUserTie />, title: 'AI 직무 영상', description: 'AI 아바타가 각 직무의 핵심 역량과 전망을 생생한 영상으로 소개해 드립니다. 궁금한 점은 무엇이든 물어보세요.', image: './src/assets/zep.jpg' },
  { id: 'portfolio-clinic', icon: <FaPaintBrush />, title: 'AI 포트폴리오 및 자기소개서 첨삭', description: '당신의 자소서와 포폴을 업로드하세요. 수만 건의 데이터를 학습한 AI가 강점과 약점을 분석하고, 합격률을 높이는 개선점을 찾아드립니다.', image: './src/assets/ze.png' },
  { id: 'virtual-interview', icon: <FaChalkboardTeacher />, title: '가상 면접 시뮬레이션', description: '실제와 같은 가상 면접 환경에서 AI 면접관과 함께 실전처럼 연습하세요. 시선 처리, 답변 속도, 음성 톤까지 분석하여 종합 피드백을 제공합니다.', image: './src/assets/interview.png' },
];

const FeatureSection = () => {
  const [activeImage, setActiveImage] = useState(features[0].image);
  const { scrollYProgress } = useScroll();
  // 미세한 패럴랙스 & 페이드
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);

  return (
    <section className="feature-section apple">
      {/* 배경 물방울을 추가 */}
      <div className="background-blur-circles">
        <div className="background-circle c1"></div>
        <div className="background-circle c2"></div>
        <div className="background-circle c3"></div>
      </div>

      <div className="section-top-header container">
        <motion.h3
          className="apple-headline"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          JOBVERSE ,  새로운  차원의 <span style={{ color: '#63278eff' }}>직업 박람회</span>
        </motion.h3>
        <motion.p
          className="apple-subhead"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.6, delay: 0.05, ease: 'easeOut' }}
        >
          AI 기술과 메타버스가 결합된 JOBVERSE에서 당신의 커리어 잠재력을 최대한으로 끌어올리세요. 단순한 정보 탐색을 넘어, 실제적인 체험과 성장을 지원합니다.
        </motion.p>
      </div>

      <div className="feature-container container">
        <div className="left-sticky-pane">
          <motion.div style={{ y, opacity }} className="feature-image-wrapper glass">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt="Feature visual"
                initial={{ opacity: 0.0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.995 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                draggable={false}
              />
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="right-scroll-pane">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              className="feature-item card glass subtle-sep"
              onViewportEnter={() => setActiveImage(feature.image)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* mono 클래스를 제거하여 아이콘에 색상 적용 */}
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-text">
                <h4 className="feature-title linklike">
                  {feature.title} <span className="arrow">›</span>
                </h4>
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
