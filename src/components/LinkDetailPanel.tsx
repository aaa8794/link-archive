import React, { useState, useEffect } from 'react';
import { Link, Folder } from '../types';

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.75 19.25 8 18.5l9.55-9.55a1.77 1.77 0 0 0 0-2.5l-.95-.95a1.77 1.77 0 0 0-2.5 0L4.55 15.05l-.8 4.2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="m13.25 6.35 4.4 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

interface Props {
  link: Link;
  folders: Folder[];
  onClose: () => void;
  onUpdate: (id: string, updates: { title?: string; folderId?: string; tags?: string[]; insight?: string; idea?: string }) => void;
  onRemove: (id: string) => void;
}

const LinkDetailPanel: React.FC<Props> = ({ link, folders, onClose, onUpdate, onRemove }) => {
  const [activeTab, setActiveTab] = useState<'insight' | 'idea'>('insight');
  const [insight, setInsight] = useState(link.insight || '');
  const [idea, setIdea] = useState(link.idea || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editFolderId, setEditFolderId] = useState(link.folderId || '');
  const [editTags, setEditTags] = useState(link.tags.join(', '));

  useEffect(() => {
    setInsight(link.insight || '');
    setIdea(link.idea || '');
    setEditTitle(link.title);
    setEditFolderId(link.folderId || '');
    setEditTags(link.tags.join(', '));
  }, [link.id]);

  const handleSaveInsight = () => {
    onUpdate(link.id, { insight });
  };

  const handleSaveIdea = () => {
    onUpdate(link.id, { idea });
  };

  const handleSaveEdit = () => {
    onUpdate(link.id, {
      title: editTitle,
      folderId: editFolderId || undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleRemove = () => {
    onRemove(link.id);
    onClose();
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-header">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="detail-url">
            {link.url}
          </a>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* OG Image */}
        {link.ogImage && (
          <div className="detail-og-wrap">
            <img src={link.ogImage} alt={link.title} className="detail-og-img" />
          </div>
        )}

        {/* Title section */}
        <div className="detail-title-section">
          {isEditing ? (
            <div className="edit-form detail-edit-form">
              <input
                className="edit-title-input detail-edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
              <select value={editFolderId} onChange={(e) => setEditFolderId(e.target.value)}>
                <option value="">폴더 없음</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input
                placeholder="태그 (쉼표로 구분)"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
              <div className="edit-actions">
                <button className="btn-cancel" onClick={() => setIsEditing(false)}>취소</button>
                <button className="btn-primary" onClick={handleSaveEdit}>저장</button>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-title-row">
                <h2 className="detail-title">{link.title}</h2>
                <button className="btn-icon" onClick={() => setIsEditing(true)}><PencilIcon /></button>
              </div>
              {link.description && <p className="detail-description">{link.description}</p>}
              {link.tags.length > 0 && (
                <div className="tag-list">
                  {link.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Growth stage indicator */}
        <div className="detail-stage">
          <span className={`stage-dot ${link.status}`} />
          <span className="stage-label">
            {link.status === 'saved' && '저장됨'}
            {link.status === 'insight' && '인사이트 작성됨'}
            {link.status === 'expanded' && '아이디어 확장됨'}
          </span>
        </div>

        {/* Tabs */}
        <div className="tab-bar detail-tabs">
          <button className={`tab ${activeTab === 'insight' ? 'active' : ''}`} onClick={() => setActiveTab('insight')}>한 줄 인사이트</button>
          <button className={`tab ${activeTab === 'idea' ? 'active' : ''}`} onClick={() => setActiveTab('idea')}>아이디어 확장</button>
        </div>

        {/* Insight Tab */}
        {activeTab === 'insight' && (
          <div className="detail-tab-content">
            <p className="detail-tab-hint">이 링크에서 무엇을 느꼈나요? 한 문장으로 남겨보세요.</p>
            <textarea
              className="insight-textarea"
              placeholder="한 줄 인사이트를 남겨보세요..."
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              rows={3}
            />
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSaveInsight} disabled={insight === (link.insight || '')}>저장</button>
            </div>
          </div>
        )}

        {/* Idea Tab */}
        {activeTab === 'idea' && (
          <div className="detail-tab-content">
            <p className="detail-tab-hint">이 영감을 기반으로 어떤 아이디어를 발전시킬 수 있을까요?</p>
            <textarea
              className="idea-textarea"
              placeholder="아이디어를 자유롭게 펼쳐보세요..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={8}
            />
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSaveIdea} disabled={idea === (link.idea || '')}>저장</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="detail-footer">
          <button className="btn-remove" onClick={handleRemove}>링크 삭제</button>
        </div>
      </div>
    </div>
  );
};

export default LinkDetailPanel;
