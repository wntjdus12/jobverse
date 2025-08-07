// components/CardNewsSection.jsx
import React from "react";
import { motion } from "framer-motion";

const cards = [
  {
    title: "쉽고 빠른 시작",
    description: "회원가입 없이 바로 이용할 수 있어요.",
    image: "/images/card-1.png",
  },
  {
    title: "함께하는 공간",
    description: "친구들과 실시간으로 소통해요.",
    image: "/images/card-2.png",
  },
  {
    title: "간편한 공유",
    description: "링크 한 번으로 쉽게 초대할 수 있어요.",
    image: "/images/card-3.png",
  },
  {
    title: "개성 있는 테마",
    description: "다양한 테마로 공간을 꾸며보세요.",
    image: "/images/card-4.png",
  },
];

const CardNewsSection = () => {
  return (
    <section className="w-full bg-gray-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">주요 기능 소개</h2>
        <div className="flex overflow-x-scroll space-x-6 scrollbar-hide">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="min-w-[300px] bg-white rounded-xl shadow-md p-6 flex-shrink-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CardNewsSection;
