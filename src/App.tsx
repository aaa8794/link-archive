import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import AddLinkForm from './components/AddLinkForm';
import EmailSettings from './components/EmailSettings';
import useLinks from './hooks/useLinks';
import useFolders from './hooks/useFolders';
import { Link, Stage } from './types';

const COLUMNS: { stage: Stage; label: string; emoji: string }[] = [
  { stage: 'saved', label: '저장', emoji: '📌' },
  { stage: 'in-progress', label: '진행중', emoji: '🔄' },
  { stage: 'done', label: '실행', emoji: '✅' },
];

const EMAIL_KEY = 'link-archive-email';

const App: React.FC = () => {
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const { links, addLink, moveLink, removeLink } = useLinks(email);
  const { folders, addFolder, removeFolder, toggleReminder } = useFolders(email);

  const [showForm, setShowForm] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const handleSaveEmail = (newEmail: string) => {
    setEmail(newEmail);
    localStorage.setItem(EMAIL_KEY, newEmail);
  };

  const visibleLinks = selectedFolderId
    ? links.filter((l) => l.folderId === selectedFolderId)
    : links.filter((l) => !l.folderId);

  const byStage = (stage: Stage): Link[] =>
    visibleLinks.filter((l) => l.stage === stage);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Linkbook</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowEmailSettings(true)}
            title={email || '이메일 설정'}
          >
            {email ? `✉ ${email}` : '✉ 이메일 설정'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 링크 추가
          </button>
        </div>
      </header>

      <div className="layout">
        {/* 사이드바 */}
        <aside className="sidebar">
          <div
            className={`folder-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => setSelectedFolderId(null)}
          >
            📁 전체
          </div>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span className="folder-name">📂 {folder.name}</span>
              <button
                className={`reminder-toggle ${folder.reminderEnabled ? 'on' : 'off'}`}
                onClick={(e) => { e.stopPropagation(); toggleReminder(folder.id, !folder.reminderEnabled); }}
                title={folder.reminderEnabled ? '알림 켜짐' : '알림 꺼짐'}
              >
                {folder.reminderEnabled ? '🔔' : '🔕'}
              </button>
              <button
                className="btn-folder-delete"
                onClick={(e) => { e.stopPropagation(); removeFolder(folder.id); }}
              >
                ×
              </button>
            </div>
          ))}

          {showNewFolderInput ? (
            <form onSubmit={handleAddFolder} className="new-folder-form">
              <input
                autoFocus
                type="text"
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => { if (!newFolderName) setShowNewFolderInput(false); }}
              />
              <button type="submit" className="btn-primary">확인</button>
            </form>
          ) : (
            <button className="btn-new-folder" onClick={() => setShowNewFolderInput(true)}>
              + 폴더 추가
            </button>
          )}
        </aside>

        {/* 메인 보드 */}
        <main className="board">
          {selectedFolder && (
            <div className="folder-header">
              <span>📂 {selectedFolder.name}</span>
              <span className={`reminder-badge ${selectedFolder.reminderEnabled ? 'on' : 'off'}`}>
                {selectedFolder.reminderEnabled ? '🔔 알림 켜짐' : '🔕 알림 꺼짐'}
              </span>
            </div>
          )}
          <div className="columns">
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
          </div>
        </main>
      </div>

      {showForm && (
        <AddLinkForm
          onAdd={addLink}
          onClose={() => setShowForm(false)}
          folders={folders}
          defaultFolderId={selectedFolderId || undefined}
        />
      )}

      {showEmailSettings && (
        <EmailSettings
          savedEmail={email}
          onSave={handleSaveEmail}
          onClose={() => setShowEmailSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
