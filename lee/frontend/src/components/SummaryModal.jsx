import React, { useEffect, useState, useRef } from 'react';
import './SummaryModal.css';

export default function SummaryModal({
  open = false,
  sessionId,
  onClose,
  onMore,           // 리포트 페이지로 이동
  baseUrl = '',     // 예: import.meta.env.VITE_API_BASE || 'http://localhost:3000'
  authHeaders       // 예: { Authorization: 'Bearer ...' }
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [bullets, setBullets] = useState([]);
  const [error, setError] = useState('');

  // 포커스 관리용
  const boxRef = useRef(null);
  const firstBtnRef = useRef(null);
  const lastBtnRef = useRef(null);

  // 모달 열릴 때 박스에 포커스
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (boxRef.current?.focus) boxRef.current.focus();
    });
  }, [open]);

  // 요약 가져오기 (authHeaders는 의존성에서 제외)
  useEffect(() => {
    if (!open || !sessionId) return;

    const ctrl = new AbortController();
    const signal = ctrl.signal;

    setLoading(true);
    setError('');
    setSummary('');
    setBullets([]);

    const apiBase = (baseUrl || '').replace(/\/+$/, '');
    const url = `${apiBase}/interview/summary/${encodeURIComponent(sessionId)}`;

    fetch(url, { headers: { ...(authHeaders || {}) }, signal })
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          throw new Error(txt || '요약 API 실패');
        }
        return r.json();
      })
      .then((d) => {
        setSummary(d.summary || '');
        setBullets(Array.isArray(d.bullets) ? d.bullets : []);
      })
      .catch((e) => {
        if (signal.aborted) return;
        setError(e?.message || '요약을 불러오지 못했어요.');
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [open, sessionId, baseUrl]);

  // 전역 ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // 포커스 트랩(Shift+Tab / Tab)
  const onKeyDownTrap = (e) => {
    if (e.key !== 'Tab') return;
    const first = firstBtnRef.current;
    const last = lastBtnRef.current;
    if (!first || !last) return;

    if (e.shiftKey) {
      // 뒤로 이동 중, 첫 요소에서 더 뒤로 못 가게
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // 앞으로 이동 중, 마지막 요소에서 더 앞으로 못 가게
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="summary-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      onClick={onClose}                 // 배경 클릭 닫기
    >
      <div
        ref={boxRef}
        className="summary-box"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 전파 방지
        tabIndex={-1}                        // 컨테이너 포커스 가능 (outline은 CSS로 숨김)
        onKeyDown={onKeyDownTrap}
      >
        {/* 헤더 */}
        <div className="summary-header">
          <span className="summary-emoji" aria-hidden>📝</span>
          <h2 id="summary-title" className="summary-title">짧은 분석</h2>
        </div>

        {/* 본문 */}
        <div className="summary-body">
          {loading && <p className="summary-loading">분석 중이에요…</p>}
          {!loading && error && <p className="summary-error">{error}</p>}

          {!loading && !error && (
            <>
              {!!summary && <p className="summary-text">{summary}</p>}
              {!!bullets.length && (
                <ul className="summary-list">
                  {bullets.map((b, i) => (
                    <li key={i} className="summary-list-item">{b}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* 액션 */}
        <div className="summary-actions">
          <button
            type="button"
            className="summary-btn"
            onClick={onClose}
            ref={firstBtnRef}
          >
            닫기
          </button>

          <button
            type="button"
            className="summary-btn summary-btn--primary"
            onClick={onMore}
            disabled={loading || !!error}
            title={loading ? '분석 중입니다' : undefined}
            ref={lastBtnRef}
          >
            더 알아보기
          </button>
        </div>
      </div>
    </div>
  );
}
