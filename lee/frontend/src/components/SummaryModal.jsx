import React, { useEffect, useState, useCallback } from 'react';
import './SummaryModal.css';

export default function SummaryModal({
  open,
  sessionId,
  onClose,
  onMore,            // 리포트 페이지로 이동
  baseUrl = '',
  authHeaders = {}   // { Authorization: 'Bearer ...' }
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [bullets, setBullets] = useState([]);
  const [error, setError] = useState('');

  // ESC로 닫기
  const onEsc = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open || !sessionId) return;
    setLoading(true);
    setError('');
    fetch(`${baseUrl}/interview/summary/${sessionId}`, { headers: { ...authHeaders } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('요약 API 실패')))
      .then(d => {
        setSummary(d.summary || '');
        setBullets(Array.isArray(d.bullets) ? d.bullets : []);
      })
      .catch((e) => setError(e.message || '요약을 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [open, sessionId, baseUrl, authHeaders]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onEsc]);

  if (!open) return null;

  return (
    <div
      className="summary-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      onClick={onClose}
    >
      <div
        className="summary-box"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <h2 id="summary-title" className="summary-title">📝 짧은 분석</h2>

        {loading ? (
          <p className="summary-loading">분석 중이에요...</p>
        ) : error ? (
          <p className="summary-error">{error}</p>
        ) : (
          <div className="summary-body">
            {!!summary && <p className="summary-text">{summary}</p>}
            {!!bullets.length && (
              <ul className="summary-list">
                {bullets.map((b, i) => (
                  <li key={i} className="summary-list-item">{b}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="summary-actions">
          <button type="button" className="summary-btn" onClick={onClose}>닫기</button>
          <button type="button" className="summary-btn summary-btn--primary" onClick={onMore}>
            더 알아보기
          </button>
        </div>
      </div>
    </div>
  );
}
