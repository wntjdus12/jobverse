import React, { useState, useRef, useEffect } from 'react';
import './Modal.css';

const Modal = ({ onSubmit, apiBase = '' }) => {
  const [name, setName] = useState('');
  const [job, setJob] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const focusInput = () => setTimeout(() => inputRef.current?.focus(), 0);

    const tokenKeys = ['token', 'accessToken', 'jwt', 'access_token'];
    const token = tokenKeys.map(k => sessionStorage.getItem(k)).find(Boolean);

    const endpoints = [
      `${apiBase}/api/profiles/me`,
      `${apiBase}/profiles/me`,
      `${apiBase}/api/profile/me`,
      `${apiBase}/profile/me`,
      `${apiBase}/api/me`,
      `${apiBase}/api/profiles/self`,
    ];

    const pickProfile = (data) => {
      const p =
        data?.profile ??
        data?.data?.profile ??
        data?.data ??
        data ?? {};
      return p;
    };

    const tryFetch = async () => {
      setLoading(true);
      setErrMsg('');

      if (!token) {
        setLoading(false);
        focusInput();
        console.warn('[Modal] sessionStorage에 토큰이 없습니다.');
        return;
      }

      let lastError;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            lastError = new Error(`HTTP ${res.status} @ ${url}`);
            continue;
          }

          const data = await res.json();
          const p = pickProfile(data);

          const guessedName =
            p.nickname ||
            p.name ||
            (typeof p.email === 'string' ? p.email.split('@')[0] : '');
          const guessedJob = p.jobTitle || p.job || p.targetJob || '';

          if (!guessedName && !guessedJob) {
            lastError = new Error('응답에 프로필 필드 없음');
            continue;
          }

          if (guessedName) setName(String(guessedName));
          if (guessedJob) setJob(String(guessedJob));
          return; // 성공하면 중단
        } catch (e) {
          lastError = e;
          continue;
        }
      }

      if (lastError) {
        console.error('[Modal] 프로필 불러오기 실패:', lastError);
        setErrMsg('프로필 자동 불러오기에 실패했어요. 직접 입력해 주세요.');
      }
      setLoading(false);
      focusInput();
    };

    tryFetch();
  }, [apiBase]);

  const isValid = name.trim() !== '' && job.trim() !== '';

  const handleSubmit = () => {
    if (isValid) {
      setShowWarning(false);
      onSubmit(name.trim(), job.trim());
    } else {
      setShowWarning(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2>📝 면접을 시작합니다</h2>

        <label htmlFor="name-input">이름을 입력해 주세요:</label>
        <input
          id="name-input"
          type="text"
          ref={inputRef}
          value={name}
          placeholder={loading ? '불러오는 중...' : '이름을 입력하세요'}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-busy={loading}
        />

        <label htmlFor="job-input">체험해보고 싶은 직무를 입력해 주세요:</label>
        <input
          id="job-input"
          type="text"
          value={job}
          placeholder={loading ? '불러오는 중...' : '예: 마케팅 매니저, 백엔드 개발자'}
          onChange={(e) => setJob(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-busy={loading}
        />

        {errMsg && <p className="modal-warning">⚠️ {errMsg}</p>}
        {(!isValid && !loading && !errMsg) && (
          <p className="modal-warning">⚠️ 이름과 직무를 모두 입력해 주세요.</p>
        )}

        <button onClick={handleSubmit} disabled={!isValid}>
          시작하기
        </button>
      </div>
    </div>
  );
};

export default Modal;
