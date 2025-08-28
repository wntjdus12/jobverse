import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './MainJob.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const MainJob = () => {
  const targetRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  // ✅ 로그인 상태를 관리하는 state 추가
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start'],
  });

  useEffect(() => {
    // ✅ 컴포넌트 마운트 시 sessionStorage에서 토큰을 확인합니다.
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ 로그아웃을 처리하는 함수
  const handleLogout = () => {
    sessionStorage.removeItem('token'); // 세션 스토리지에서 토큰 삭제
    setIsLoggedIn(false); // 로그인 상태를 false로 업데이트
    window.location.href = "https://jobverse.site/login/"; // 로그인 페이지로 이동
  };

  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const taglineY = useTransform(scrollYProgress, [0, 0.4], [0, -100]);
  const descriptionY = useTransform(scrollYProgress, [0, 0.4], [0, 100]);
  const titleScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.8]);
  const videoScale = useTransform(scrollYProgress, [0, 0.7], [1, 1.2]);
  const videoBrightness = useTransform(scrollYProgress, [0, 0.7], [1, 0.7]);
  const videoFilter = useMotionTemplate`brightness(${videoBrightness})`; // ensure MotionValue works in CSS

  return (
    <>
      <header className="main-header">
        <div className="logo">JOBVERSE</div>
        <nav>
          <a href="#news" onClick={(e) => {
              e.preventDefault();
              navigate("/mypage");
            }}>마이페이지</a>

          <a href="#ai" onClick={() => {
                    window.location.href = "https://jobverse.site/interview/";}} >가상 면접</a>

          <a href="#guide"  onClick={() => {
            window.location.href = "https://jobverse.site/document/document-landing";
          }}>AI 취업 코칭</a>
        </nav> 
        {/* ✅ isLoggedIn 상태에 따라 버튼을 조건부로 렌더링합니다. */}
        {isLoggedIn ? (
          <button className="play-button" onClick={handleLogout}>로그아웃</button>
        ) : (
          <button className="play-button" onClick={() => {
            window.location.href = "https://jobverse.site/login/";}}>로그인</button>
        )}
      </header>

      <main ref={targetRef} className="main-job-container">
        <div className="sticky-content">
          <motion.div
            style={{ scale: videoScale, filter: videoFilter }}
            className="video-container"
          >
            <video
              className="background-video"
              autoPlay
              loop
              muted
              playsInline
              poster="/videos/poster.jpg"
            >
              <source src="/videos/main-background.mp4" type="video/mp4" />
              <source src="/videos/main-background.webm" type="video/webm" />
              브라우저가 비디오 태그를 지원하지 않습니다.
            </video>
          </motion.div>

          <motion.div
            className="content-overlay"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              style={{ y: taglineY, opacity: textOpacity }}
              variants={itemVariants}
              className="tagline"
            >
              Every career becomes a universe
            </motion.p>
            <motion.h1
              style={{ scale: titleScale, opacity: textOpacity }}
              variants={itemVariants}
              className="main-title"
            >
              JOBVERSE
            </motion.h1>
            <motion.p
              style={{ y: descriptionY, opacity: textOpacity }}
              variants={itemVariants}
              className="description"
            >
              JOBVERSE는 몰입감 높은 시뮬레이션을 통해 다양한 직무를 체험하고,
              <br />
              자신만의 커리어 스토리를 만들어 나갈 수 있는 메타버스 플랫폼입니다.
            </motion.p>
          </motion.div>

          <motion.div style={{ opacity: textOpacity }} className="scroll-down-indicator">
            <span>SCROLL DOWN</span>
            <div className="mouse-icon">
              <div className="wheel"></div>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default MainJob;
