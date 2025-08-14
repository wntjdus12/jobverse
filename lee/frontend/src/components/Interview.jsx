import React, { useState, useRef } from 'react';
import './Interview.css';
import Modal from './Modal';
import EndModal from './EndModal';
import SummaryModal from './SummaryModal'; // ✅ 추가
import interviewerA from '../assets/interviewerA.png';
import interviewerB from '../assets/interviewerB.png';
import interviewerC from '../assets/interviewerC.png';
import userProfile from '../assets/user.png';

const Interview = () => {
  const [showModal, setShowModal] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // ✅ 추가
  const [username, setUsername] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [currentInterviewer, setCurrentInterviewer] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [round, setRound] = useState(0);        // UI/로그용으로만 사용
  const [firstAnswer, setFirstAnswer] = useState('');
  const [sessionId, setSessionId] = useState(null);

  // 개발 기본값: 프론트(8501) → 백엔드(3000)
  const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/interview';
  // SummaryModal은 /interview/summary/:id 를 호출하므로 루트 base 필요
  const SUMMARY_BASE = BASE_URL.replace(/\/+interview\/?$/, ''); // ✅ 추가

  const interviewerIds = ['C', 'A', 'B'];
  const prevInterviewerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const ttsQueue = useRef([]);
  const isSpeaking = useRef(false);

  const interviewerInfo = {
    A: { name: '인사팀', image: interviewerA },
    B: { name: '기술팀', image: interviewerB },
    C: { name: '실무 팀장', image: interviewerC },
  };

  const getRandomInterviewer = () => {
    const filtered = interviewerIds.filter(id => id !== prevInterviewerRef.current);
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    prevInterviewerRef.current = selected;
    return selected;
  };

  // 헤더 안전 읽기(대소문자/노출 문제 방어)
  const getHeader = (res, name) =>
    res.headers.get(name) ||
    res.headers.get(name.toLowerCase()) ||
    res.headers.get(name.toUpperCase()) ||
    null;

  // 공통 fetch 래퍼
  const safeFetch = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('❌ Fetch fail:', res.status, url, t);
      throw new Error(`HTTP ${res.status} on ${url}`);
    }
    return res;
  };

  const playNextInQueue = async () => {
    if (isSpeaking.current || ttsQueue.current.length === 0) return;
    const { text, role } = ttsQueue.current.shift();
    isSpeaking.current = true;
    try {
      const res = await safeFetch(`${BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = audio;
      audio.onended = () => {
        isSpeaking.current = false;
        playNextInQueue();
      };

      audio.play().catch(console.warn);
    } catch (err) {
      console.error('🔈 TTS 재생 오류:', err);
      isSpeaking.current = false;
    }
  };

  /**
   * 서버 스트리밍 수신
   * - 종료는 헤더 `X-Interview-Ended: 1`로 신뢰
   * - 본문 스트림 내 종료 멘트는 보조 신호
   * @returns {{ended: boolean, text: string}}
   */
  const streamChatResponse = async (payload) => {
    try {
      const res = await safeFetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.body) throw new Error('응답 스트림 없음');

      const interviewerHeader = getHeader(res, 'interviewer'); // 정상 흐름이면 존재
      const endHeader = getHeader(res, 'X-Interview-Ended');
      const preEnded = endHeader === '1'; // 서버가 즉시 종료를 선언한 경우

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let fullText = '';
      let sentenceBuffer = '';
      let endedByServer = preEnded;

      // interviewer가 있을 때만 말풍선 생성
      if (interviewerHeader && !endedByServer) {
        setCurrentInterviewer(interviewerHeader);
        setChat(prev => [...prev, { sender: interviewerHeader, text: '' }]);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const content = line.replace(/^data:\s*/, '').trim();
          if (content === '[DONE]') {
            // 서버 스트림 종료 토큰
            break;
          }

          let delta = '';
          try {
            const json = JSON.parse(content);
            delta = json.answer || '';
          } catch {
            // ignore malformed chunk
          }

          // 종료 문구가 본문에 오면 보조 신호로 종료
          if (/면접이 종료되었습니다/.test(delta)) endedByServer = true;

          // interviewer 없거나 종료 상태면 화면 업데이트 중단
          if (!interviewerHeader || endedByServer) break;

          // 정상 스트리밍 업데이트
          fullText += delta;
          sentenceBuffer += delta;

          setChat(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.sender === interviewerHeader) {
              updated[updated.length - 1] = { ...last, text: (last.text || '') + delta };
            }
            return updated;
          });

          if (/[.!?…]\s?$/.test(sentenceBuffer)) {
            ttsQueue.current.push({ text: sentenceBuffer.trim(), role: interviewerHeader });
            sentenceBuffer = '';
            playNextInQueue();
          }
        }

        if (endedByServer) break;
      }

      // 남은 문장 TTS (정상 흐름일 때만)
      if (!endedByServer && interviewerHeader && sentenceBuffer.trim()) {
        ttsQueue.current.push({ text: sentenceBuffer.trim(), role: interviewerHeader });
        playNextInQueue();
      }

      return { ended: endedByServer, text: fullText };
    } catch (err) {
      console.error('❌ 스트리밍 실패:', err.message);
      return { ended: false, text: '' };
    }
  };

  // 첫 질문
  const pickFirstInterviewer = async (nameParam = null) => {
    const name = nameParam || username;

    const res = await safeFetch(`${BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jobRole })
    });
    const data = await res.json();

    setSessionId(data.sessionId);
    const interviewerKey =
      getHeader(res, 'interviewer') ||
      data.interviewer ||
      getRandomInterviewer();
    setCurrentInterviewer(interviewerKey);

    const { question } = data;
    setChat([{ sender: interviewerKey, text: question }]);
    ttsQueue.current.push({ text: question, role: interviewerKey });
    playNextInQueue();

    setRound(1); // UI/로그용
  };

  // 사용자 입력 전송 (백엔드 종료 신호만 신뢰)
  const handleUserSubmit = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setChat(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    if (round === 1) setFirstAnswer(userText);

    if (!sessionId) {
      console.warn('세션이 없습니다. 먼저 시작을 진행하세요.');
      return;
    }

    const { ended } = await streamChatResponse({
      sessionId,
      jobRole,
      message: userText,
      userName: username
    });

    if (ended) {
      setShowEndModal(true);
      return;
    }

    // 단순 카운트(표시나 분석용), 제한 기능은 백엔드가 수행
    setRound(prev => prev + 1);
  };

  // 음성 녹음(STT)
  const handleStartRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    audioChunksRef.current = [];
    setIsRecording(true);

    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      formData.append('user', username);

      try {
        const res = await safeFetch(`${BASE_URL}/stt`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.text) setInput(data.text);
      } catch (err) {
        console.error('❌ STT 오류:', err);
      }
    };

    recorder.start();
  };

  const handleNameSubmit = (name, job) => {
    setUsername(name);
    setJobRole(job);
    setShowModal(false);
    setTimeout(() => pickFirstInterviewer(name), 500);
  };

  const handleInterviewEnd = () => {
    setShowEndModal(false);
    window.location.href = '/';
  };

  // ✅ “짧은 분석” 버튼 핸들러
  const handleQuickSummary = () => {
    setShowEndModal(false);
    setShowSummary(true);
  };

  return (
    <div className="interview-fullscreen">
      {showModal && <Modal onSubmit={handleNameSubmit} />}

      {showEndModal && (
        <EndModal
          open={showEndModal}
          onClose={handleInterviewEnd}
          onQuick={handleQuickSummary}  // ✅ 연결
        />
      )}

      {/* ✅ 요약 모달 렌더링 */}
      <SummaryModal
        open={showSummary}
        sessionId={sessionId}
        onClose={() => setShowSummary(false)}
        onMore={() => {}}
        baseUrl={SUMMARY_BASE}
      />

      <div className="interviewers">
        {['C','A','B'].map((id) => (
          <div key={id} className={`interviewer-card ${currentInterviewer === id ? 'active' : ''}`}>
            <img src={interviewerInfo[id].image} alt={interviewerInfo[id].name} />
            <p>{interviewerInfo[id].name}</p>
          </div>
        ))}
      </div>

      <div className="question-display">
        {chat
          .filter(msg => msg.sender !== 'user')
          .slice(-1)
          .map((msg, idx) => (
            <div key={idx} className="question-msg">
              <strong>{interviewerInfo[msg.sender]?.name}:</strong> {msg.text}
            </div>
          ))}
      </div>

      <div className="user-bottom">
        <img src={userProfile} alt="지원자" className="user-card" />
        <div className="user-input-box">
          <input
            type="text"
            placeholder="답변을 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserSubmit()}
          />
          <button onClick={handleStartRecording}>{isRecording ? '🛑' : '🎤'}</button>
          <button onClick={handleUserSubmit}>📤</button>
        </div>
      </div>
    </div>
  );
};

export default Interview;
