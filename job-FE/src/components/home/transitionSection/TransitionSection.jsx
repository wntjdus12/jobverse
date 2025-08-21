// TransitionSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './TransitionSection.css';

// 콘텐츠 등장 애니메이션을 위한 Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
      when: 'beforeChildren', // 자식 애니메이션 전에 부모 애니메이션 시작
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

const topTextVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5 } },
};

const TransitionSection = () => {
  return (
    
    <motion.section 
      className="transition-section-laptop"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
    >
       <div 
          className="laptop-top-text"
          variants={topTextVariants}
        
        >
          <h1 className="main-text">Map 안으로 ,</h1>
         
        </div>
      
      {/* 노트북 목업 이미지를 배경으로 사용하는 컨테이너 */}
      <div className="laptop-container" >
       
        {/* 비디오와 텍스트가 표시될 노트북 화면 영역 */}
        <div className="laptop-screen-content">
          {/* 비디오 태그 */}
          <video autoPlay loop muted playsInline key={Date.now()} className="laptop-video">
            <source src="public/video/video.mp4" type="video/mp4" />
            브라우저가 비디오를 지원하지 않습니다.
          </video>
          
          {/* 비디오 위에 겹쳐지는 어두운 오버레이 */}
          <div className="screen-overlay"></div>
          
          {/* 비디오 위에 표시되는 콘텐츠 (텍스트, 버튼) */}
          <div className="content-container-transition">
            <motion.h2 
              className="transition-text-video" 
              variants={itemVariants}
            >
              새로운 커리어의 지도를 펼쳐보세요
            </motion.h2>
            
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
        </div>
      </div>
    </motion.section>
  );
};

export default TransitionSection;
