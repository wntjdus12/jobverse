// components/ScrollSection.tsx
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import portfolioImg from "/root/jobverse/job-FE/src/assets/portfolio.png.webp"
import interiview from "/root/jobverse/job-FE/src/assets/interview.png"
import zep from "/root/jobverse/job-FE/src/assets/zep.jpg"

const scrollContents = [
  {
    title: "나만의 포트폴리오 만들기",
    description: "직무별 템플릿을 기반으로 포트폴리오를 쉽고 빠르게 작성하세요.",
    image: portfolioImg,
  },
  {
    title: "AI 모의면접으로 실전 준비",
    description: "AI 기반 질문으로 실전 면접을 미리 경험하고 대비할 수 있어요.",
    image: interiview,
  },
  {
    title: "직무 체험으로 나에게 맞는 커리어 찾기",
    description: "다양한 직무를 체험해보며 나에게 맞는 진로를 탐색해보세요.",
    image: zep,
  },
];

const ScrollBlock = ({ title, description, image, reverse = false }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`flex flex-col md:flex-row items-center gap-12 ${
        reverse ? "md:flex-row-reverse" : ""
      }`}
    >
      <motion.img
        src={image}
        alt={title}
        className="w-full md:w-1/3 rounded-xl shadow-xl"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="md:w-1/2 text-center md:text-left"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black ">{title}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
      </motion.div>
    </div>
  );
};

const ScrollSection = () => {
  return (
    <section className="relative z-20 w-full bg-white py-24 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-22">
        {scrollContents.map((content, index) => (
          <ScrollBlock
            key={index}
            title={content.title}
            description={content.description}
            image={content.image}
            reverse={index % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
};

export default ScrollSection;
