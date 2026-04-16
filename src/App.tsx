import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import AddLinkForm from './components/AddLinkForm';
import AuthPage from './components/AuthPage';
import useAuth from './hooks/useAuth';
import useLinks from './hooks/useLinks';
import useFolders from './hooks/useFolders';
import useInsights from './hooks/useInsights';
import { Folder } from './types';

const INTERESTS = [
  { id: 'visual', label: '비주얼', desc: '이미지, 색감, 레퍼런스' },
  { id: 'writing', label: '글 & 문장', desc: '카피, 아티클, 에세이' },
  { id: 'product', label: '제품 & UX', desc: '기획, 서비스 디자인' },
  { id: 'culture', label: '트렌드 & 컬처', desc: '소셜, 패션, 음악' },
  { id: 'space', label: '공간 & 오브젝트', desc: '인테리어, 물건' },
  { id: 'tech', label: '테크 & 코드', desc: '개발, 툴, 자동화' },
];

const App: React.FC = () => {
  const { user, profile, loading, signOut, completeOnboarding } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { links, addLink, updateLink, toggleLike, removeLink } = useLinks(user?.id ?? '');
  const { folders, addFolder, removeFolder, toggleReminder } = useFolders(user?.id ?? '');
  const { insights, fetchInsights, addInsight, togglePin, removeInsight } = useInsights();

  const [showForm, setShowForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [filterLiked, setFilterLiked] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <span className="auth-logo">archiv<span className="auth-logo-star">*</span>o</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

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
        <h1 className="logo"><img src="/Archivologo.svg" alt="archiv*o" className="logo-img" /></h1>
        <div className="header-actions">
          <button
            className={`btn-filter ${filterLiked ? 'active' : ''}`}
            onClick={() => setFilterLiked(!filterLiked)}
          >
            {filterLiked ? '좋아요만' : '전체'}
          </button>
          <button className="btn-secondary" onClick={signOut}>
            {user.email}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 링크 추가
          </button>
        </div>
      </header>

      <div className="layout">
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

      {profile && !profile.onboardingCompleted && (
        <div className="modal-overlay">
          <div className="modal welcome-modal">
            <div className="welcome-header">
              <img src="/Archivologo.svg" alt="archiv*o" className="welcome-logo" />
              <h2 className="welcome-title">
                <span className="welcome-username">{profile.username}</span>님, 어서오세요!
              </h2>
              <p className="welcome-desc">
                어떤 영감에 관심이 있나요?<br />
                아카이브를 채워갈 테마를 골라보세요.
              </p>
            </div>

            <div className="interest-grid">
              {INTERESTS.map((item) => (
                <button
                  key={item.id}
                  className={`interest-chip ${selectedInterests.includes(item.id) ? 'selected' : ''}`}
                  onClick={() =>
                    setSelectedInterests((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((i) => i !== item.id)
                        : [...prev, item.id]
                    )
                  }
                >
                  <span className="interest-label">{item.label}</span>
                  <span className="interest-desc">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="welcome-actions">
              <button
                className="btn-primary welcome-start-btn"
                onClick={() => completeOnboarding(selectedInterests)}
                disabled={selectedInterests.length === 0}
              >
                시작하기
              </button>
              <button
                className="btn-skip"
                onClick={() => completeOnboarding([])}
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
