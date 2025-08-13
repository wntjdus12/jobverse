// components/ScrollSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './ScrollSection.css';
import { FaPlus } from 'react-icons/fa6';

const newsData = [
  { tag: '업데이트', image: '/images/news-image-1.jpg', date: '2025.08.11' },
  { tag: '개발자 노트', image: '/images/news-image-2.jpg', date: '2025.08.05'},
  { tag: '이벤트', image: '/images/news-image-3.jpg', date: '2025.07.28'},
  { tag: '공지사항', image: '/images/news-image-4.jpg', date: '2025.07.21'},
  { tag: '점검', image: '/images/news-image-5.jpg', date: '2025.07.15'},
];

const NewsCard = ({ tag, image, date, title }) => (
  <motion.div className="news-card" whileHover={{ y: -10, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15)' }} transition={{ type: 'spring', stiffness: 300 }}>
    <div className="card-image-container">
      <img src={image} alt={title} className="card-image" />
      <span className="card-tag">{tag}</span>
    </div>
    <div className="card-content">
      <p className="card-date">{date}</p>
      <h3 className="card-title">{title}</h3>
    </div>
    <a href="#" className="card-link">자세히 보기</a>
  </motion.div>
);

const ScrollSection = () => {
  return (
    <motion.section className="scroll-section" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
      <div className="wavy-background" />
      <div className="section-container">
        <header className="scroll-section-header">
          <div className="header-title-group">
            <h2 className="section-main-title"><span className="title-dots"></span>소식</h2>
            <p className="section-subtitle">JOBVERSE의 새로운 소식을 확인하세요.</p>
          </div>
          <a href="#" className="see-more-button"><FaPlus /> 더 보기</a>
        </header>
        <div className="card-scroll-container">
          {newsData.map((news, index) => (<NewsCard key={index} {...news} />))}
        </div>
      </div>
    </motion.section>
  );
};

export default ScrollSection;