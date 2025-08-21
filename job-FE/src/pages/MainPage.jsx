import React from "react";
import ScrollSection from "../components/home/scrollSection/ScrollSection";
import MainJob from "../components/home/mainjob/MainJob";
import CardNewsSection from "../components/home/cardNewsSection/CardNewsSection";
import VideoBackgroundSection from "../components/home/videoBackgroundSection/VideoBackgroundSection";
import Header from "../components/Header";
import TransitionSection from "../components/home/transitionSection/TransitionSection";
import FeatureSection from "../components/home/featureSection/FeatureSection";
import NewsletterSection from "../components/home/newsletterSection/NewsletterSection";
import Footer from "../components/home/footer/Footer";



function MainPage() {
  return (
    <main className="overflow-x-hidden">
      {/* <Header/> */}
      <MainJob />
      <TransitionSection />
      <FeatureSection/>
      
    
      <CardNewsSection />
      <VideoBackgroundSection />
      <NewsletterSection />
      <Footer />
    </main>
  );
}

export default MainPage;
