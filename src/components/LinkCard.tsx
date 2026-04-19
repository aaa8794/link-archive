import React, { useState } from 'react';
import { Link, Insight, Folder } from '../types';

interface LinkCardProps {
  link: Link;
  insights: Insight[];
  folders: Folder[];
  onToggleLike: (id: string, liked: boolean) => void;
  onClick: () => void;
  onUpdate: (id: string, updates: { title?: string; folderId?: string; tags?: string[] }) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
  link, insights, folders, onToggleLike, onClick, onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editFolderId, setEditFolderId] = useState(link.folderId || '');
  const [editTags, setEditTags] = useState(link.tags.join(', '));

  const pinnedInsight = insights.find((i) => i.isPinned);

  const handleSaveEdit = () => {
    onUpdate(link.id, {
      title: editTitle,
      folderId: editFolderId || undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  return (
    <div className={`link-card ${link.liked ? 'liked' : ''}`}>
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
              >
                {link.liked ? '❤️' : '🤍'}
              </button>
              <button className="btn-icon" onClick={() => setIsEditing(!isEditing)}>✏️</button>
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
              {pinnedInsight && (
                <div className="pinned-insight-preview">📌 {pinnedInsight.content}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkCard;
