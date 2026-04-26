import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import LinkCard from './components/LinkCard';
import FolderSidePanel from './components/FolderSidePanel';
import AddLinkForm from './components/AddLinkForm';
import AuthPage from './components/AuthPage';
import LoadingScreen from './components/LoadingScreen';
import LinkDetailPage from './pages/LinkDetailPage';
import useAuth from './hooks/useAuth';
import useLinks from './hooks/useLinks';
import useFolders from './hooks/useFolders';
import { Folder } from './types';

const INTERESTS = [
  { id: 'visual', label: '비주얼', desc: '이미지, 색감, 레퍼런스' },
  { id: 'writing', label: '글 & 문장', desc: '카피, 아티클, 에세이' },
  { id: 'product', label: '제품 & UX', desc: '기획, 서비스 디자인' },
  { id: 'culture', label: '트렌드 & 컬처', desc: '소셜, 패션, 음악' },
  { id: 'space', label: '공간 & 오브젝트', desc: '인테리어, 물건' },
  { id: 'tech', label: '테크 & 코드', desc: '개발, 툴, 자동화' },
];

const HomeIcon = ({ active }: { active?: boolean }) => (
  <img src={active ? '/ic-home-active.png' : '/ic-home-disabled.png'} width={20} height={20} alt="" />
);

const FolderIcon = ({ active }: { active?: boolean }) => (
  <img src={active ? '/ic-folder-fill-active.png' : '/ic-folder-fill.png'} width={20} height={20} alt="" />
);


const HomeLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAnonymous, signOut, completeOnboarding } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { links, addLink, updateLink, toggleLike } = useLinks(user?.id ?? '');
  const { folders, addFolder, removeFolder } = useFolders(user?.id ?? '');

  const [showForm, setShowForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [filterLiked, setFilterLiked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('signup');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthDefaultTab(tab);
    setShowAuthModal(true);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderInput(false);
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
            <button className="btn-secondary" onClick={() => openAuth('login')}>로그인</button>
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

      <div className="layout">
        <aside className="sidebar">
          <div
            className={`folder-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => setSelectedFolderId(null)}
          >
            <span className="sidebar-icon"><HomeIcon active={selectedFolderId === null} /></span>
            <span className="folder-name">전체</span>
          </div>
          {folders.map((folder: Folder) => (
            <div
              key={folder.id}
              className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <span className="sidebar-icon"><FolderIcon active={selectedFolderId === folder.id} /></span>
              <span className="folder-name">{folder.name}</span>
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
                <FolderIcon active />
                <span>{selectedFolder.name}</span>
              </div>
            )}
            <div className="board-meta">
              <span className="link-count">{visibleLinks.length}개의 링크</span>
            </div>
          </div>

          {visibleLinks.length === 0 ? (
            <div className="empty-state">
              <img src="/empty.png" alt="" className="empty-illustration" />
              <p className="empty-title">저장된 링크가 없어요</p>
              <p className="empty-subtitle">링크를 추가해보세요!</p>
            </div>
          ) : (
            <div className="link-list">
              {visibleLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  folders={folders}
                  onToggleLike={toggleLike}
                  onClick={() => navigate(`/archive/${link.id}`)}
                  onUpdate={updateLink}
                />
              ))}
            </div>
          )}
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
          userId={user?.id}
        />
      )}

      {showAuthModal && (
        <AuthPage
          onClose={() => setShowAuthModal(false)}
          defaultTab={authDefaultTab}
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
              <button className="btn-skip" onClick={() => completeOnboarding([])}>
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MIN_LOADING_MS = 3000;

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  const [loadingExiting, setLoadingExiting] = useState(false);
  const mountTime = React.useRef(Date.now());

  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - mountTime.current;
      const wait = Math.max(0, MIN_LOADING_MS - elapsed);
      const t = setTimeout(() => {
        setLoadingExiting(true);
        const t2 = setTimeout(() => setShowLoading(false), 650);
        return () => clearTimeout(t2);
      }, wait);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (showLoading) return <LoadingScreen exiting={loadingExiting} />;

  return (
    <Routes>
      <Route path="/" element={<HomeLayout />} />
      <Route path="/archive" element={<HomeLayout />} />
      <Route path="/archive/:id" element={<LinkDetailPage userId={user?.id ?? ''} />} />
    </Routes>
  );
};

export default App;
