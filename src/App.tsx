import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import AddLinkForm from './components/AddLinkForm';
import EmailSettings from './components/EmailSettings';
import useLinks from './hooks/useLinks';
import useFolders from './hooks/useFolders';
import useInsights from './hooks/useInsights';
import { Folder } from './types';

const EMAIL_KEY = 'link-archive-email';

const App: React.FC = () => {
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const { links, addLink, updateLink, toggleLike, removeLink } = useLinks(email);
  const { folders, addFolder, removeFolder, toggleReminder } = useFolders(email);
  const { insights, fetchInsights, addInsight, togglePin, removeInsight } = useInsights();

  const [showForm, setShowForm] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [filterLiked, setFilterLiked] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSaveEmail = (newEmail: string) => {
    setEmail(newEmail);
    localStorage.setItem(EMAIL_KEY, newEmail);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleExpand = (linkId: string) => {
    const next = expandedLinkId === linkId ? null : linkId;
    setExpandedLinkId(next);
    if (next && !insights[next]) fetchInsights(next);
  };

  const handleAiSummary = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: visibleLinks }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      setAiSummary('요약 생성에 실패했어요.');
    } finally {
      setAiLoading(false);
    }
  };

  const visibleLinks = links
    .filter((l) => selectedFolderId ? l.folderId === selectedFolderId : !l.folderId)
    .filter((l) => filterLiked ? l.liked : true);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Linkbook</h1>
        <div className="header-actions">
          <button
            className={`btn-filter ${filterLiked ? 'active' : ''}`}
            onClick={() => setFilterLiked(!filterLiked)}
          >
            {filterLiked ? '좋아요만' : '전체'}
          </button>
          <button className="btn-secondary" onClick={() => setShowEmailSettings(true)}>
            {email ? email : '이메일 설정'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 링크 추가
          </button>
        </div>
      </header>

      <div className="layout">
        {/* 왼쪽 사이드바 - 폴더 */}
        <aside className="sidebar">
          <div
            className={`folder-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => { setSelectedFolderId(null); setAiSummary(null); }}
          >
            전체
          </div>
          {folders.map((folder: Folder) => (
            <div
              key={folder.id}
              className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => { setSelectedFolderId(folder.id); setAiSummary(null); }}
            >
              <span className="folder-name">{folder.name}</span>
              <button
                className="reminder-toggle"
                onClick={(e) => { e.stopPropagation(); toggleReminder(folder.id, !folder.reminderEnabled); }}
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
          <button className="btn-new-folder" onClick={() => setShowNewFolderInput(true)}>
            + 폴더 추가
          </button>
        </aside>

        {/* 메인 */}
        <main className="board">
          <div className="board-header">
            {selectedFolder && (
              <div className="folder-header">
                <span>📂 {selectedFolder.name}</span>
                <span className={`reminder-badge ${selectedFolder.reminderEnabled ? 'on' : 'off'}`}>
                  {selectedFolder.reminderEnabled ? '🔔 알림 켜짐' : '🔕 알림 꺼짐'}
                </span>
              </div>
            )}
            <div className="board-meta">
              <span className="link-count">{visibleLinks.length}개의 링크</span>
              {selectedFolderId && (
                <button
                  className={`btn-ai-summary ${aiLoading ? 'loading' : ''}`}
                  onClick={handleAiSummary}
                  disabled={aiLoading || visibleLinks.length === 0}
                >
                  {aiLoading ? '요약 중...' : '✨ AI 읽기 모드'}
                </button>
              )}
            </div>
          </div>

          <div className="link-list">
            {visibleLinks.length === 0 ? (
              <p className="empty-hint">저장된 링크가 없어요</p>
            ) : (
              visibleLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  insights={insights[link.id] || []}
                  folders={folders}
                  onToggleLike={toggleLike}
                  onRemove={removeLink}
                  onExpand={handleExpand}
                  isExpanded={expandedLinkId === link.id}
                  onUpdate={updateLink}
                  onAddInsight={addInsight}
                  onTogglePin={togglePin}
                  onRemoveInsight={removeInsight}
                />
              ))
            )}
          </div>
        </main>

        {/* 오른쪽 AI 요약 사이드바 */}
        {aiSummary !== null && (
          <aside className="ai-sidebar">
            <div className="ai-sidebar-header">
              <span>✨ AI 읽기 모드</span>
              <button className="btn-close" onClick={() => setAiSummary(null)}>×</button>
            </div>
            <div className="ai-summary-content">
              <p>{aiSummary}</p>
            </div>
            <div className="ai-link-list">
              {visibleLinks.map((l) => (
                <div key={l.id} className="ai-link-item">
                  <span className="ai-link-title">{l.title}</span>
                  {l.description && <span className="ai-link-desc">{l.description}</span>}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {showNewFolderInput && (
        <div className="modal-overlay" onClick={() => setShowNewFolderInput(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>폴더 추가</h2>
            <form onSubmit={handleAddFolder}>
              <input
                autoFocus
                type="text"
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewFolderInput(false)}>취소</button>
                <button type="submit" className="btn-primary">추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
