import React from 'react';
import './VideoBackgroundSection.css';
import { FaBriefcase, FaCode, FaBullhorn, FaChartLine, FaGears } from 'react-icons/fa6';

// 직무 월드 데이터 예시
// 아이콘, 이름, 현재 참여자 수를 정의합니다.
const jobWorlds = [
  { 
    name: '개발', 
    participants: 4820, 
    icon: <FaCode style={{ color: '#5865F2' }} /> 
  },
  { 
    name: '마케팅', 
    participants: 3129, 
    icon: <FaBullhorn style={{ color: '#F47B20' }} /> 
  },
  { 
    name: '경영', 
    participants: 2876, 
    icon: <FaChartLine style={{ color: '#43B581' }} /> 
  },
  { 
    name: '생산', 
    participants: 1954, 
    icon: <FaGears style={{ color: '#FEE75C' }} /> 
  },
];

// 총 참여자 수를 계산합니다.
const totalParticipants = jobWorlds.reduce((sum, job) => sum + job.participants, 0);

const VideoBackgroundSection = () => {
  return (
    <section className="video-section">
      {/* 1. 배경 동영상 및 색상 오버레이 */}
      <div className="video-background">
        <video autoPlay loop muted playsInline>
          {/* 자신의 비디오 파일 경로를 여기에 입력하세요 */}
          <source src="/videos/job-background.mp4" type="video/mp4" />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
        {/* 요청하신 디자인처럼 보라색 틴트를 입히는 오버레이입니다. */}
        <div className="video-overlay"></div>
      </div>

      {/* 2. 실제 콘텐츠 영역 */}
      <div className="section-content">
        {/* 왼쪽 설명 영역 */}
        <div className="left-pane">
          <div className="section-icon-wrapper">
            <FaBriefcase size={40} />
          </div>
          <h2 className="section-title">나의 커리어 월드 탐색하기</h2>
          <p className="section-description">
            JOBVERSE 커뮤니티에서 다양한 직무 경험을 공유하고,
            <br />
            시뮬레이션 게임을 통해 관심있는 직무를 미리 체험하며 멋진 경험을 공유해보세요.
          </p>
          <button className="section-cta-button">
            JOBVERSE 월드 바로가기
          </button>
        </div>

        {/* 오른쪽 직무 소개 위젯 */}
        <div className="right-pane">
          <div className="job-widget">
            <div className="widget-header">
              <p>현재 활성화된 월드</p>
              <span>🚀 <strong>{totalParticipants.toLocaleString()}</strong> Explorers Online</span>
            </div>
            <ul className="widget-list">
              {jobWorlds.map((job) => (
                <li key={job.name} className="widget-list-item">
                  <div className="job-icon">{job.icon}</div>
                  <div className="job-info">
                    <span className="job-name">{job.name}</span>
                    <span className="job-participants">
                      <span className="online-dot"></span>
                      {job.participants.toLocaleString()}명 참여중
                    </span>
                  </div>
                  <button className="join-button">참여하기</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoBackgroundSection;