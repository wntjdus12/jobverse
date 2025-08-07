// components/VideoBackgroundSection.jsx
import React from "react";
import { motion } from "framer-motion";

const VideoBackgroundSection = () => {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* 백그라운드 비디오 */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover brightness-[0.6]"
        src="/videos/background.mp4" // 실제 영상 경로로 바꿔주세요
        autoPlay
        muted
        loop
        playsInline
      />

      {/* 오버레이 */}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40"></div>

      {/* 콘텐츠 */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 text-white max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          생생한 영상과 함께하는 경험
        </h2>
        <p className="text-lg md:text-xl mb-8">
          플레이인조이처럼 역동적인 백그라운드 영상으로 분위기를 살려보세요.
        </p>
        <button className="px-8 py-3 bg-primary rounded-full font-semibold hover:bg-indigo-600 transition">
          지금 시작하기
        </button>
      </motion.div>
    </section>
  );
};

export default VideoBackgroundSection;
