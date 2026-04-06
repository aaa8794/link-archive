import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import AddLinkForm from './components/AddLinkForm';
import EmailSettings from './components/EmailSettings';
import useLinks from './hooks/useLinks';
import { sendReminder } from './utils/sendReminder';
import { Link, Stage } from './types';

const COLUMNS: { stage: Stage; label: string; emoji: string }[] = [
  { stage: 'saved', label: '저장', emoji: '📌' },
  { stage: 'in-progress', label: '진행중', emoji: '🔄' },
  { stage: 'done', label: '실행', emoji: '✅' },
];

const EMAIL_KEY = 'link-archive-email';

const App: React.FC = () => {
  const { links, addLink, moveLink, removeLink } = useLinks();
  const [showForm, setShowForm] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const byStage = (stage: Stage): Link[] =>
    links.filter((l) => l.stage === stage);

  const handleSaveEmail = (newEmail: string) => {
    setEmail(newEmail);
    localStorage.setItem(EMAIL_KEY, newEmail);
  };

  const handleSendReminder = async () => {
    if (!email) {
      setShowEmailSettings(true);
      return;
    }
    const pending = links.filter((l) => l.stage !== 'done');
    if (pending.length === 0) {
      showToast('보낼 링크가 없어요.');
      return;
    }
    setSending(true);
    try {
      await sendReminder(email, links);
      showToast('이메일을 보냈어요!');
    } catch {
      showToast('전송 실패. EmailJS 설정을 확인해주세요.');
    } finally {
      setSending(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Link Archive</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowEmailSettings(true)}
            title={email || '이메일 설정'}
          >
            {email ? `✉ ${email}` : '✉ 이메일 설정'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleSendReminder}
            disabled={sending}
          >
            {sending ? '전송중...' : '알림 보내기'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 링크 추가
          </button>
        </div>
      </header>

      <main className="board">
        {COLUMNS.map(({ stage, label, emoji }) => (
          <div key={stage} className="column">
            <div className="column-header">
              <span className="column-emoji">{emoji}</span>
              <span className="column-label">{label}</span>
              <span className="column-count">{byStage(stage).length}</span>
            </div>
            <div className="column-body">
              {byStage(stage).length === 0 ? (
                <p className="empty-hint">비어 있어요</p>
              ) : (
                byStage(stage).map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onMove={moveLink}
                    onRemove={removeLink}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </main>

      {showForm && (
        <AddLinkForm onAdd={addLink} onClose={() => setShowForm(false)} />
      )}

      {showEmailSettings && (
        <EmailSettings
          savedEmail={email}
          onSave={handleSaveEmail}
          onClose={() => setShowEmailSettings(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default App;
