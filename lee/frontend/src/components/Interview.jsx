import React, { useState, useRef, useEffect } from 'react';
import './Interview.css';
import Modal from './Modal';
import EndModal from './EndModal';
import SummaryModal from './SummaryModal';
import interviewerA from '../assets/interviewerA.png';
import interviewerB from '../assets/interviewerB.png';
import interviewerC from '../assets/interviewerC.png';
import userProfile from '../assets/user.png';
import { AnimatePresence } from 'framer-motion';

const Interview = () => {
  const [showModal, setShowModal] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [username, setUsername] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [currentInterviewer, setCurrentInterviewer] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [round, setRound] = useState(0);
  const [firstAnswer, setFirstAnswer] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sttStatus, setSttStatus] = useState('idle');
  const [isComposing, setIsComposing] = useState(false); // IME 조합 상태

  const BASE_URL = import.meta.env.VITE_API_BASE || '/interview-api';
  const SUMMARY_BASE = BASE_URL;

  const [ttsEnabled, setTtsEnabled] = useState(false);

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

  const getHeader = (res, name) =>
    res.headers.get(name) ||
    res.headers.get(name.toLowerCase()) ||
    res.headers.get(name.toUpperCase()) ||
    null;

  const safeFetch = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('Fetch fail:', res.status, url, t);
      throw new Error(`HTTP ${res.status} on ${url}`);
    }
    return res;
  };

  const unlockAudio = async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.warn('Audio unlock skipped:', e);
    }
  };

  const playNextInQueue = async () => {
    if (!ttsEnabled || isSpeaking.current || ttsQueue.current.length === 0) return;
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

      await audio.play().catch(err => {
        console.warn('TTS play blocked:', err);
      });
    } catch (err) {
      console.error('🔈 TTS 재생 오류:', err);
      isSpeaking.current = false;
    }
  };

  const getChatResponse = async (payload) => {
    try {
      const res = await safeFetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.body) throw new Error('응답 스트림 없음');

      const interviewerHeader = getHeader(res, 'interviewer');
      const endHeader = getHeader(res, 'X-Interview-Ended');
      const preEnded = endHeader === '1';

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let fullResponse = '';
      let endedByServer = preEnded;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const content = line.replace(/^data:\s*/, '').trim();
          if (content === '[DONE]') break;

          let delta = '';
          try {
            const json = JSON.parse(content);
            delta = json.answer || '';
          } catch { /* ignore */ }

          fullResponse += delta;
        }
      }

      return {
        interviewer: interviewerHeader,
        text: fullResponse.trim(),
        ended: endedByServer || /면접이 종료되었습니다/.test(fullResponse),
      };

    } catch (err) {
      console.error('스트리밍 실패:', err.message);
      return { ended: false, text: '' };
    }
  };

  const pickFirstInterviewer = async (nameParam, jobParam) => {
    const name = nameParam ?? username;
    const role = jobParam ?? jobRole;

    const res = await safeFetch(`${BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: name, jobRole: role })
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

    setRound(1);
  };

  const handleUserSubmit = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    // 사용자 답변을 즉시 화면에 표시
    setChat([{ sender: 'user', text: userText }]);
    setInput('');

    if (round === 1) setFirstAnswer(userText);

    if (!sessionId) {
      console.warn('세션이 없습니다. 먼저 시작을 진행하세요.');
      return;
    }

    const { interviewer, text, ended } = await getChatResponse({
      sessionId,
      jobRole,
      message: userText,
      userName: username
    });

    if (ended) {
      setShowEndModal(true);
      return;
    }
    
    // 면접관의 답변이 오면, 현재 면접관 상태를 업데이트합니다.
    if (interviewer) {
      setCurrentInterviewer(interviewer);
    }
    
    // 면접관의 답변이 오면, 채팅 목록을 면접관의 질문으로만 대체합니다.
    setChat([
      { sender: interviewer, text }
    ]);

    ttsQueue.current.push({ text, role: interviewer });
    playNextInQueue();

    setRound(prev => prev + 1);
  };

  const handleStartRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setSttStatus('processing');
      setInput(''); // STT 처리 중엔 입력창 비우기
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunksRef.current = [];
      setIsRecording(true);
      setSttStatus('recording');

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
          if (data.text) {
            setInput(data.text); // 사용자가 Enter로 확정해서 보낼 수 있게만 채움
          }
        } catch (err) {
          console.error('STT 오류:', err);
        } finally {
          setSttStatus('idle');
        }
      };

      recorder.start();
    } catch (e) {
      console.warn('녹음 권한 거부/오류:', e);
      if (e?.name === 'NotAllowedError') {
        alert('마이크 권한을 허용해 주세요. 브라우저 주소창 우측의 권한 설정을 확인하세요.');
      } else {
        alert('마이크 초기화에 실패했습니다.');
      }
    }
  };

  const handleNameSubmit = async (name, job) => {
    setUsername(name);
    setJobRole(job);
    setShowModal(false);

    await unlockAudio();
    setTtsEnabled(true);
  };

  const handleInterviewEnd = () => {
    setShowEndModal(false);
    window.location.href = '/';
  };

  const handleQuickSummary = () => {
    setShowEndModal(false);
    setShowSummary(true);
  };

  useEffect(() => {
    if (ttsEnabled && username && jobRole && chat.length === 0) {
      pickFirstInterviewer(username, jobRole);
    }
  }, [ttsEnabled, username, jobRole, chat.length]);

  const getPlaceholderText = () => {
    if (isRecording) return '녹음 중... 말씀하세요.';
    if (sttStatus === 'processing') return '음성 인식 중...';
    return '답변을 입력하세요';
  };

  return (
    <div className="interview-fullscreen">
      <AnimatePresence>
        {showModal && <Modal onSubmit={handleNameSubmit} />}
      </AnimatePresence>

      {showEndModal && (
        <EndModal
          open={showEndModal}
          onClose={handleInterviewEnd}
          onQuick={handleQuickSummary}
        />
      )}

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
        {chat.map((msg, idx) => {
          if (msg.sender === 'user') {
            return (
              <div key={idx} className="user-message-container">
                <p className="answer-msg">
                  <strong>{username}:</strong> {msg.text}
                </p>
              </div>
            );
          } else {
            return (
              <div key={idx} className="interviewer-message-container">
                <p className="question-msg">
                  <strong>{interviewerInfo[msg.sender]?.name}:</strong> {msg.text}
                </p>
              </div>
            );
          }
        })}
      </div>

      <div className="user-bottom">
        <img src={userProfile} alt="지원자" className="user-card" />
        <div className="user-input-box">
          <input
            type="text"
            placeholder={getPlaceholderText()}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isComposing && !e.nativeEvent?.isComposing) {
                handleUserSubmit();
              }
            }}
          />
          <button onClick={handleStartRecording}>{isRecording ? '🛑' : '🎤'}</button>
          <button onClick={handleUserSubmit}>📤</button>
        </div>
      </div>
    </div>
  );
};

export default Interview;
