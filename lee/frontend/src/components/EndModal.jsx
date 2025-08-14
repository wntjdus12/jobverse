import React from 'react';
import './EndModal.css';

const EndModal = ({ open = true, onClose, onQuick }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <div className="modal-box">
        <h2 id="end-title">🎉 면접이 종료되었습니다.</h2>
        <p>수고하셨습니다! 간단한 요약을 확인하시겠어요?</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose}>닫기</button>
          <button onClick={onQuick}>짧은 분석</button>
        </div>
      </div>
    </div>
  );
};

export default EndModal;