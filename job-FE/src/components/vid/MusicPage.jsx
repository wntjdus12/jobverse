import React, { useState } from "react";
import backgroundImage from "/root/jobverse/job-FE/src/assets/vision.png"; // 경로 확인 필요
import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence 추가

export default function MusicPage() {
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const videoObjectId = "689944f1f3ad63177f07443c";

  // 동영상 애니메이션을 위한 variants
  const videoVariants = {
    hidden: { 
      scaleX: 0, // 중앙에서 시작
      borderRadius: "100%",
      opacity: 0,
    },
    visible: { 
      scaleX: 1, // 양옆으로 펼쳐짐
      borderRadius: "30px", // 둥근 모서리 적용
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut" 
      }
    }
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-no-repeat bg-center flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100%',
      }}
    >
      {/* 1. 오버레이 */}
      <div className="absolute inset-0 bg-black/15"></div>

      {/* 2. 메인 콘텐츠 (흐린 박스) */}
      <div className="relative z-10 text-center text-white rounded-2xl bg-white/10 backdrop-blur-md shadow-lg"
           style={{ width: '1280px' , height: '680px', marginLeft: '50px' , marginBottom: '15px', borderRadius: '30px', overflow: 'hidden' }}>
    
        <AnimatePresence>
          {isLoading && (
            // 로딩 중일 때 깔끔한 스피너를 보여줍니다.
            <motion.div
              key="spinner"
              className="absolute inset-0 flex items-center justify-center z-30"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }} // 어두운 배경 추가
            >
              <div className="w-16 h-16 border-4 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. 비디오를 흐린 박스 안으로 이동 (애니메이션 적용) */}
        <motion.video
          className="absolute inset-0 w-full h-full object-fill"
          style={{borderRadius: '30px'}}
          src={`/api/video/${videoObjectId}`} 
          autoPlay
          loop
          playsInline
          variants={videoVariants}
          initial="hidden"
          animate="visible"
          onLoadedData={handleVideoLoaded} // 동영상 로딩 완료 시 이벤트 핸들러 추가
        >
          Your browser does not support the video tag.
        </motion.video>

        {/* 5. 비디오 위에 텍스트 등을 배치하기 위한 컨테이너 */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          
        </div>
      </div>
    </div>
  );
}
