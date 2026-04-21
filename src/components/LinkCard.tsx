import React, { useState } from 'react';
import { Link, Folder } from '../types';

interface LinkCardProps {
  link: Link;
  folders: Folder[];
  onToggleLike: (id: string, liked: boolean) => void;
  onClick: () => void;
  onUpdate: (id: string, updates: { title?: string; folderId?: string; tags?: string[] }) => void;
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12.1 20.25s-6.85-4.18-9.1-8.03C1.32 9.47 2.54 6 6 6c2.18 0 3.63 1.2 4.46 2.53C11.28 7.2 12.73 6 14.91 6c3.46 0 4.68 3.47 3 6.22-2.25 3.85-9.1 8.03-9.1 8.03Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill={filled ? 'currentColor' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

const LinkCard: React.FC<LinkCardProps> = ({ link, folders, onToggleLike, onClick, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editFolderId, setEditFolderId] = useState(link.folderId || '');
  const [editTags, setEditTags] = useState(link.tags.join(', '));

  const handleSaveEdit = () => {
    onUpdate(link.id, {
      title: editTitle,
      folderId: editFolderId || undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  return (
    <div className={`link-card status-${link.status} ${link.liked ? 'liked' : ''}`}>
      <div className="link-card-main" onClick={() => !isEditing && onClick()}>
        {link.ogImage && (
          <div className="link-og-thumb-wrap">
            <img src={link.ogImage} alt={link.title} className="link-og-thumb" />
          </div>
        )}
        <div className="link-card-body">
          <div className="link-card-top">
            {isEditing ? (
              <input
                className="edit-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <h3 className="link-title">{link.title}</h3>
            )}
            <div className="link-card-top-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className={`btn-like ${link.liked ? 'active' : ''}`}
                onClick={() => onToggleLike(link.id, !link.liked)}
                aria-label={link.liked ? '좋아요 해제' : '좋아요'}
              >
                <HeartIcon filled={link.liked} />
              </button>
              <button
                className="btn-icon"
                onClick={() => setIsEditing(!isEditing)}
                aria-label="편집"
              >
                <PencilIcon />
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="edit-form" onClick={(e) => e.stopPropagation()}>
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
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url" onClick={(e) => e.stopPropagation()}>
                {link.url}
              </a>
              {link.description && <p className="link-description">{link.description}</p>}
              {link.tags.length > 0 && (
                <div className="tag-list">
                  {link.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              )}
              {link.insight && (
                <div className="card-insight-preview">{link.insight}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkCard;
