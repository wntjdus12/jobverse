import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [nickname, setNickname] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 헤더 배경 변경
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 사용자 닉네임 불러오기
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData && userData.name) {
      setNickname(userData.name);
    }
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        {/* 로고 */}
        <div className="text-2xl font-extrabold" style={{ color: "#bf84ff" }}>
          jobverse
        </div>

        {/* 네비게이션 */}
        <nav className="hidden md:flex gap-8 text-gray-800 font-medium items-center relative z-50">
          {/* 마이페이지 */}
          {/* AI 면접 (드롭다운 토글) */}
          <a
            href="#intro"
            style={{ textDecoration: "none", color: "#bf84ff" }}
            className="hover:text-purple-600 transition"
            onClick={(e) => {
              e.preventDefault();
              navigate("/mypage");
            }}
          >
            마이페이지
          </a>
        <div className="relative" ref={dropdownRef}>
          <div
            style={{ textDecoration: "none", color: "#bf84ff" }} // ✅ 마이페이지와 동일
            className="hover:text-purple-600 transition font-medium" // ✅ 동일한 클래스
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            AI 면접
            <span className="text-sm">{dropdownOpen ? "▲" : "▼"}</span>
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-3 w-40 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] overflow-hidden animate-fade-in">
              <div
                onClick={() => {
                  window.location.href = "https://jobverse.site/interview/";
                  setDropdownOpen(false);
                }}
                className="px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 cursor-pointer"
              >
                가상 면접
              </div>
              <div
                onClick={() => {
                  navigate("/ai-report");
                  setDropdownOpen(false);
                }}
                className="px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 cursor-pointer"
              >
                분석 리포트 보기
              </div>
            </div>
          )}
        </div>

          {/* AI 취업 코칭 */}
          <a
            href="#logout"
            style={{ textDecoration: "none", color: "#bf84ff" }} // ✅ 마이페이지와 동일
            className="hover:text-purple-600 transition font-medium" // ✅ 동일한 클래스
          >
            AI 취업 코칭
          </a>


          {/* 사용자 이니셜 */}
          {nickname && (
            <div
              className="ml-4 rounded-full w-10 h-10 bg-purple-400 text-white flex items-center justify-center text-sm font-bold border border-purple-300 shadow"
              style={{ backgroundColor: "#9370DB" }}
            >
              {nickname.slice(0, 2)}
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
