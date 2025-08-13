// MapPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MapPage.css";
import JobSelector from "./JobSelector";
import Header from "./Header";

// [수정] JobSelector.jsx의 jobCategories 구조와 완벽하게 일치시킨 zepLinks 객체
const zepLinks = {
  개발: {
    backend: "https://zep.us/play/dJGaXo",   // 백엔드 개발자
    frontend: "https://zep.us/play/dJGaXo",  // 프론트엔드 개발자
    ai: "https://zep.us/play/dJGaXo",        // AI/데이터 개발자
    devops: "https://zep.us/play/dJGaXo",    // DevOps/인프라 개발자
    default: "https://zep.us/play/dJGaXo",   // 혹시 모를 기본값
  },
  마케팅: {
    // 요청하신 대로 디지털/퍼포먼스 마케터에 각각 다른 URL을 지정합니다.
    digital: "https://zep.us/play/mkxRqe",
    performance: "https://zep.us/play/lpMa7P",
    // 다른 마케팅 직무들은 기본 마케팅 월드로 연결합니다.
    content: "https://zep.us/play/mkJXMe",
    planning: "https://zep.us/play/mkJXMe",
    default: "https://zep.us/play/mkJXMe", // 마케팅 카테고리의 기본값
  },
  경영: {
    finance: "https://zep.us/play/7RlVQP",
    product: "https://zep.us/play/7RlVQP",
    business: "https://zep.us/play/7RlVQP",
    hr: "https://zep.us/play/7RlVQP",
    default: "https://zep.us/play/7RlVQP",
  },
  생산: {
    worker: "https://zep.us/play/7RlVQP",
    quality: "https://zep.us/play/7RlVQP",
    manager: "https://zep.us/play/7RlVQP",
    engineer: "https://zep.us/play/7RlVQP",
    default: "https://zep.us/play/7RlVQP",
  },
};

const MapPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [nickname, setNickname] = useState("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [zoomState, setZoomState] = useState("");

  useEffect(() => {
    const fetchNickname = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNickname(response.data.user.name);
      } catch (error) {
        console.error("닉네임 불러오기 실패", error);
      }
    };
    fetchNickname();
  }, []);

  const handleLocationClick = () => {
    setZoomState("zoom-location");
    setSelectedJob("location");
    setTimeout(() => {
      setShowLocationPopup(true);
    }, 50);
  };

  // 이 함수는 이전과 동일하지만, 수정된 zepLinks 객체와 함께 동작하여 이제 정확히 작동합니다.
  const handleJobSelect = (category, jobKey, label) => {
    setShowLocationPopup(false);
    const newZoomClass = `zoom-${category}-${jobKey}`;
    setZoomState(newZoomClass);

    setTimeout(() => {
      const url = zepLinks[category]?.[jobKey] || zepLinks[category]?.default;

      if (url) {
        window.location.href = url;
      } else {
        console.error(`'${category}' 카테고리의 '${jobKey}' 직무에 대한 URL을 찾을 수 없습니다.`);
      }
    }, 2000);
  };

  return (
    <>
      <Header />
      <div className="map-container">
        <img
          src="./assets/room.jpg"
          alt="맵"
          className={`map-image ${zoomState}`}
          width={90}
          height={90}
        />

        {zoomState !== "zoom-location" && !showLocationPopup && (
          <img
            src="./assets/location-icon.png"
            alt="위치 아이콘"
            className="location-icon"
            onClick={handleLocationClick}
          />
        )}

        {showLocationPopup && <JobSelector onSelect={handleJobSelect} />}
      </div>
    </>
  );
};

export default MapPage;