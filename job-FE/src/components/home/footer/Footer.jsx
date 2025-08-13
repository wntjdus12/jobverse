// Footer.jsx
import React from 'react';
import './Footer.css';
import { FaYoutube, FaTiktok, FaInstagram, FaTwitter } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="social-links">
          <a href="#" aria-label="Youtube"><FaYoutube /></a>
          <a href="#" aria-label="Tiktok"><FaTiktok /></a>
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Twitter"><FaTwitter /></a>
        </div>

        <div className="footer-logo">
          <span>JOBVERSE</span>
        </div>

        <nav className="footer-legal-links">
          <a href="#">이용약관</a>
          <a href="#"><strong>개인정보 처리방침</strong></a>
          <a href="#">쿠키 정책</a>
          <a href="#">채용</a>
        </nav>

        <div className="copyright">
          &copy; {new Date().getFullYear()} JOBVERSE, INC. ALL RIGHTS RESERVED.
        </div>

        <div className="business-info-table">
          <table>
            <tbody>
              <tr>
                <td>(주)잡버스</td>
                <td>대표: 주서연</td>
                <td>주소: 서울특별시 강남구 서초시</td>
              </tr>
              <tr>
                <td>사업자등록번호: 123-45-67890</td>
                <td>통신판매업신고번호: 제2025-서울강남-1234호</td>
                <td>전화: 02-1234-5678</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 오른쪽 플로팅 버튼들은 App.jsx 등에서 별도로 관리하는 것이 더 좋습니다. */}
        {/* 예시로만 포함합니다. */}
        <div className="floating-buttons">
          <a href="#" className="canvas-button">CANVAS</a>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="top-button" aria-label="맨 위로 이동">
            &uarr;
          </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;