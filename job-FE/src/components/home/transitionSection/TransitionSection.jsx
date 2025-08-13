// TransitionSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './TransitionSection.css';

// 등장 애니메이션을 위한 Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // 자식 요소(큰글씨, 작은글씨, 버튼)가 순차적으로 등장
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
    },
  },
};

const TransitionSection = () => {
  return (
    <motion.section 
      className="transition-section-video"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={containerVariants}
    >
      <div className="video-background-transition">
        <video autoPlay loop muted playsInline key={Date.now()}>
          <source src="public/video/video.mp4" type="video/mp4" />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
        <div className="video-overlay-dark"></div>
      </div>

      <div className="content-container-transition">
        {/* [수정] 큰 글씨 (메인 헤드라인) */}
        <motion.h2 
          className="transition-text-video" 
          variants={itemVariants}
        >
          새로운 커리어의 지도를 펼쳐보세요
        </motion.h2>
        
        {/* [추가] 작은 글씨 (설명 문구) */}
        <motion.p
          className="transition-subtext-video"
          variants={itemVariants}
        >
          AI 멘토부터 가상 면접까지, JOBVERSE 맵에서
          <br />
          당신의 커리어에 필요한 모든 것을 직접 체험하고 탐색해보세요.
        </motion.p>
        
        <motion.a 
          href="/map"
          className="map-button"
          variants={itemVariants}
          whileHover={{ scale: 1.05, boxShadow: '0px 10px 30px rgba(88, 101, 242, 0.5)' }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          맵 바로가기 &rarr;
        </motion.a>
      </div>
    </motion.section>
  );
};

export default TransitionSection;