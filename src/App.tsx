import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import LinkDetailPanel from './components/LinkDetailPanel';
import FolderSidePanel from './components/FolderSidePanel';
import AddLinkForm from './components/AddLinkForm';
import AuthPage from './components/AuthPage';
import useAuth from './hooks/useAuth';
import useLinks from './hooks/useLinks';
import useFolders from './hooks/useFolders';
import { Folder, Link } from './types';

const INTERESTS = [
  { id: 'visual', label: '비주얼', desc: '이미지, 색감, 레퍼런스' },
  { id: 'writing', label: '글 & 문장', desc: '카피, 아티클, 에세이' },
  { id: 'product', label: '제품 & UX', desc: '기획, 서비스 디자인' },
  { id: 'culture', label: '트렌드 & 컬처', desc: '소셜, 패션, 음악' },
  { id: 'space', label: '공간 & 오브젝트', desc: '인테리어, 물건' },
  { id: 'tech', label: '테크 & 코드', desc: '개발, 툴, 자동화' },
];

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const BellOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8"/>
    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
    <path d="M18 8a6 6 0 0 0-9.33-5"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const App: React.FC = () => {
  const { user, profile, loading, isAnonymous, signOut, completeOnboarding } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { links, addLink, updateLink, toggleLike, removeLink } = useLinks(user?.id ?? '');
  const { folders, addFolder, removeFolder, toggleReminder } = useFolders(user?.id ?? '');

  const [showForm, setShowForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [filterLiked, setFilterLiked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('signup');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthDefaultTab(tab);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <span className="auth-logo">archiv<span className="auth-logo-star">*</span>o</span>
        </div>
      </div>
    );
  }

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleLinkClick = (link: Link) => {
    setSelectedLink(link);
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
          {isAnonymous ? (
            <>
              <button className="btn-secondary" onClick={() => openAuth('login')}>로그인</button>
            </>
          ) : (
            <>
              <button
                className={`btn-filter ${filterLiked ? 'active' : ''}`}
                onClick={() => setFilterLiked(!filterLiked)}
              >
                {filterLiked ? '좋아요만' : '전체'}
              </button>
              <button className="btn-secondary" onClick={signOut}>
                {profile?.username ?? user?.email}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + 링크 추가
          </button>
        </div>
      </header>

      {isAnonymous && !bannerDismissed && (
        <div className="anon-banner">
          <span>현재 이 기기에만 저장돼요.</span>
          <button className="anon-banner-cta" onClick={() => openAuth('signup')}>
            계정 만들면 모바일에서도 볼 수 있어요 →
          </button>
          <button className="anon-banner-close" onClick={() => setBannerDismissed(true)} aria-label="닫기">×</button>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <div
            className={`folder-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => setSelectedFolderId(null)}
          >
            <span className="sidebar-icon"><HomeIcon /></span>
            <span className="folder-name">전체</span>
          </div>
          {folders.map((folder: Folder) => (
            <div
              key={folder.id}
              className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span className="sidebar-icon"><FolderIcon /></span>
              <span className="folder-name">{folder.name}</span>
              <button
                className="reminder-toggle"
                onClick={(e) => { e.stopPropagation(); toggleReminder(folder.id, !folder.reminderEnabled); }}
              >
                {folder.reminderEnabled ? <BellIcon /> : <BellOffIcon />}
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
            <span className="sidebar-icon sidebar-add-icon">+</span>
            <span className="folder-name">폴더 추가</span>
          </button>
        </aside>

        <main className="board">
          <div className="board-header">
            {selectedFolder && (
              <div className="folder-header">
                <span><FolderIcon /> {selectedFolder.name}</span>
                <span className={`reminder-badge ${selectedFolder.reminderEnabled ? 'on' : 'off'}`}>
                  {selectedFolder.reminderEnabled ? '🔔 알림 켜짐' : '🔕 알림 꺼짐'}
                </span>
              </div>
            )}
            <div className="board-meta">
              <span className="link-count">{visibleLinks.length}개의 링크</span>
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
                  folders={folders}
                  onToggleLike={toggleLike}
                  onClick={() => handleLinkClick(link)}
                  onUpdate={updateLink}
                />
              ))
            )}
          </div>
        </main>

        {selectedFolder && (
          <FolderSidePanel
            folder={selectedFolder}
            links={visibleLinks}
          />
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

      {showAuthModal && (
        <AuthPage
          onClose={() => setShowAuthModal(false)}
          defaultTab={authDefaultTab}
        />
      )}

      {selectedLink && (
        <LinkDetailPanel
          link={selectedLink}
          folders={folders}
          onClose={() => setSelectedLink(null)}
          onUpdate={(id, updates) => {
            updateLink(id, updates);
            setSelectedLink((prev) => prev ? { ...prev, ...updates } : null);
          }}
          onRemove={removeLink}
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
