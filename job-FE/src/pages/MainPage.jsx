import React from "react";
import ScrollSection from "../components/home/ScrollSection";
import MainJob from "../components/home/MainJob";
import CardNewsSection from "../components/home/CardNewsSection";
import VideoBackgroundSection from "../components/home/VideoBackgroundSection";
import DownloadCTASection from "../components/home/DownloadCTASection";
import Header from "../components/Header";


function MainPage() {
  return (
    <main className="overflow-x-hidden">
      <Header/>
      <MainJob />
      <ScrollSection />     
      <CardNewsSection />
      <VideoBackgroundSection />
      <DownloadCTASection />
    </main>
  );
}

export default MainPage;
