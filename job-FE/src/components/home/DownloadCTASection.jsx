import React from "react";
import { motion } from "framer-motion";

const DownloadCTASection = () => {
  return (
    <section className="bg-primary text-white py-20 px-4 text-center">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
          지금 바로 Playinzoi를 시작해보세요
        </h2>
        <p className="text-lg md:text-xl mb-8">
          새로운 경험이 여러분을 기다리고 있습니다.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <a
            href="#"
            className="bg-white text-primary font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition"
          >
            App Store에서 받기
          </a>
          <a
            href="#"
            className="bg-white text-primary font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Google Play에서 받기
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default DownloadCTASection;
