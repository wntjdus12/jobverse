// MapPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MapPage.css";
import JobSelector from "./JobSelector";
import Header from "./Header";


const zepLinks = {
  개발: "https://zep.us/play/dJGaXo",
  마케팅: "https://zep.us/play/mkJXMe",
  경영: "https://zep.us/play/7RlVQP",
  생산: "https://zep.us/play/7RlVQP",
};

const MapPage = () => {
  const [selectedJob, setSelectedJob] = useState(null); // "location" | "카테고리-key"
  const [nickname, setNickname] = useState("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [zoomState, setZoomState] = useState(""); // zoom css 클래스 관리

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

    // 확대 애니메이션 이후 살짝 딜레이 주고 팝업 표시 (0.6초)
    setTimeout(() => {
      setShowLocationPopup(true);
    }, 50);
  };

  const handleJobSelect = (category, jobKey) => {
    setShowLocationPopup(false);
    const newZoomClass = `zoom-${category}-${jobKey}`;
    setZoomState(newZoomClass);

    setTimeout(() => {
      const url = zepLinks[category];
      if (url) window.location.href = url;
    }, 2000); // 확대 후 이동
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

      {/* 위치 아이콘은 처음에만 보임 */}
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
