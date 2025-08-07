import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';


const MainJob = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const y = useTransform(scrollYProgress, [0.2, 0.8], ['100%', '0%']);
  const navigate = useNavigate();

  return (
    <div className="relative h-[200vh] bg-white">
      {/* 고정되는 첫 화면 */}
      <section className="sticky top-0 h-screen flex flex-col justify-center items-center px-6 md:px-12 text-white z-10 overflow-hidden">
        
        {/* ✅ 동영상 + 오버레이 */}
        <div className="absolute top-[90px] bottom-[90px] left-[80px] right-[90px] z-0 rounded-xl overflow-hidden">
          <video
            src="/video/neon.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
        </div>

        {/* 🔵 배경 애니메이션 원 */}
        <motion.div 
          className="absolute rounded-full bg-primary opacity-20 w-72 h-72 top-10 left-10 blur-3xl z-20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute rounded-full bg-secondary opacity-10 w-96 h-96 bottom-10 right-10 blur-3xl z-20"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 📝 텍스트 & 버튼 */}
        <motion.p
          style={{ opacity }}
          className="max-w-xl text-center text-lg md:text-xl mb-20 z-30"
        >
          나를 위한 단 하나의 직무 탐색 플랫폼
        </motion.p>
        <motion.h1  
          style={{ opacity }}
          className="text-9xl md:text-[12rem] font-extrabold mb-9 mt-10 text-center z-50"
        >
          직무 설명, 이제는 AI가 대신합니다.
        </motion.h1>

        <motion.p
          style={{ opacity }}
          className="max-w-xl text-center text-lg md:text-xl text-secondary mb-20 z-30"
        >
          – 메타버스 속 직업 설명회 플랫폼
        </motion.p>

      </section>

      {/* 아래에서 올라오는 섹션 */}
      <motion.section
  style={{ y }}
  
>
  {/* 🔽 배경 영상 */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute top-[2px] bottom-[90px] left-[80px] right-[90px] z-0 rounded-xl overflow-hidden"
  >
    <source src="/video/video.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>

  {/* 🔽 위에 올라올 텍스트 */}
  <motion.h4
  initial={{ opacity: 0, y: 80 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1.2, ease: "easeOut" }}
  className=" absolute z-30 text-4xl md:text-7xl text-right text-gray-700 ml-40 top-[250px] left-[450px] "
  style={{ color: '#666666' }} 
>
 <strong className="font-bold text-black">메타버스 맵</strong>을 탐험하며 다양한 부스를 방문하고,<br /><br />
  직무에 대한 깊이 있는 설명을 <strong className="font-bold text-black">직관적인 AI 영상</strong>으로 만나보세요.<br /><br />
  누구보다 빠르고 쉽게, <strong className="font-bold text-black">나에게 맞는 직업</strong>을 이해할 수 있어요.
</motion.h4>
<motion.button 
     whileHover={{ scale: 1.1 }}
     whileTap={{ scale: 0.95 }}
     className="absolute text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#4b3ee0] transition-colors z-30 top-[450px] right-[300px]"
     style={{ backgroundColor: '#c596f6ff' }} 
     onClick={() => navigate('/map')}
    >
    맵 둘러보기
</motion.button>
</motion.section>

    </div>
  );
};

export default MainJob;
