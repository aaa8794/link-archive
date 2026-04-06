import React, { useState } from 'react';

interface EmailSettingsProps {
  savedEmail: string;
  onSave: (email: string) => void;
  onClose: () => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ savedEmail, onSave, onClose }) => {
  const [email, setEmail] = useState(savedEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSave(email.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>알림 이메일 설정</h2>
        <p className="modal-desc">저장된 링크를 이메일로 받아볼 수 있어요.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일 주소 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailSettings;
