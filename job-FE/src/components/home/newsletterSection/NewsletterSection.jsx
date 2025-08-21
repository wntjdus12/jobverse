// NewsletterSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './NewsletterSection.css';
import { FaRegUser, FaRegEnvelope } from 'react-icons/fa6';

// Framer Motion 등장 애니메이션 설정
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
};

const characterVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.5 } },
};

const NewsletterSection = () => {
  return (
    <motion.section
      className="newsletter-section"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="newsletter-container">
        {/* 왼쪽: 폼 영역 */}
        <div className="form-column">
          <motion.h2 variants={itemVariants} className="newsletter-title">
            <span className="title-highlight">JOBVERSE</span>
            <br />
            지금 구독하고 최신 소식을 받아보세요.
          </motion.h2>
          
          <motion.form variants={itemVariants} className="newsletter-form">
            <div className="input-group">
              <FaRegUser className="input-icon" />
              <input type="text" placeholder="닉네임을 입력해주세요." />
            </div>
            <div className="input-group">
              <FaRegEnvelope className="input-icon" />
              <input type="email" placeholder="이메일을 입력해주세요." />
            </div>

            <div className="agreement-group">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                [필수] 개인정보 수집 및 이용에 동의합니다.
                <a href="#" className="details-link">자세히 보기</a>
              </label>
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                [필수] 광고성 정보 수신에 동의합니다.
                <a href="#" className="details-link">자세히 보기</a>
              </label>
            </div>
            <button type="submit" className="subscribe-button">최신 소식 받기</button>
          </motion.form>
        </div>

        {/* 오른쪽: 캐릭터 영역 */}
        <div className="character-column">
          <motion.div variants={characterVariants} className="character-wrapper">
            <img src="./public/bus.png" alt="JOBVERSE Avatar" className="character-image" />
            <motion.div 
              className="speech-bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1 }}
            >
              JOBVERSE
            </motion.div>
          </motion.div>
           <motion.div 
             variants={characterVariants} 
             className="character-wrapper-secondary"
             transition={{ delay: 0.2 }}
            >
            <img src="./public/job.png" alt="JOBVERSE Robot Avatar" className="character-image-secondary" />
             <motion.div 
              className="speech-bubble secondary"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.2 }}
            >
              구독 감사합니다!
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* 배경 장식용 도형 */}
      <div className="deco-shape shape-1"></div>
      <div className="deco-shape shape-2"></div>
    </motion.section>
  );
};

export default NewsletterSection;