import React, { useState } from 'react';
import { Link, Insight, Folder } from '../types';

interface LinkCardProps {
  link: Link;
  insights: Insight[];
  folders: Folder[];
  onToggleLike: (id: string, liked: boolean) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onUpdate: (id: string, updates: { title?: string; folderId?: string; tags?: string[]; retrospective?: string }) => void;
  onAddInsight: (linkId: string, content: string, imageFile?: File) => void;
  onTogglePin: (linkId: string, insightId: string, isPinned: boolean) => void;
  onRemoveInsight: (linkId: string, insightId: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
  link, insights, folders, onToggleLike, onRemove, onExpand,
  isExpanded, onUpdate, onAddInsight, onTogglePin, onRemoveInsight,
}) => {
  const [insightText, setInsightText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editFolderId, setEditFolderId] = useState(link.folderId || '');
  const [editTags, setEditTags] = useState(link.tags.join(', '));
  const [retrospective, setRetrospective] = useState(link.retrospective || '');
  const [editingRetro, setEditingRetro] = useState(false);
  const [activeTab, setActiveTab] = useState<'insight' | 'retro'>('insight');

  const pinnedInsight = insights.find((i) => i.isPinned);

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightText.trim()) return;
    onAddInsight(link.id, insightText.trim(), imageFile);
    setInsightText('');
    setImageFile(undefined);
  };

  const handleSaveEdit = () => {
    onUpdate(link.id, {
      title: editTitle,
      folderId: editFolderId || undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleSaveRetro = () => {
    onUpdate(link.id, { retrospective });
    setEditingRetro(false);
  };

  return (
    <div className={`link-card ${link.liked ? 'liked' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {/* 카드 헤더 */}
      <div className="link-card-main" onClick={() => !isEditing && onExpand(link.id)}>
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
              {pinnedInsight && !isExpanded && (
                <div className="pinned-insight-preview">📌 {pinnedInsight.content}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 펼쳐진 영역 */}
      {isExpanded && !isEditing && (
        <div className="insight-section" onClick={(e) => e.stopPropagation()}>
          {/* 탭 */}
          <div className="tab-bar">
            <button className={`tab ${activeTab === 'insight' ? 'active' : ''}`} onClick={() => setActiveTab('insight')}>인사이트</button>
            <button className={`tab ${activeTab === 'retro' ? 'active' : ''}`} onClick={() => setActiveTab('retro')}>회고</button>
          </div>

          {activeTab === 'insight' && (
            <>
              <div className="insight-list">
                {insights.length === 0 && (
                  <p className="insight-empty">아직 인사이트가 없어요. 첫 메모를 남겨보세요!</p>
                )}
                {insights.map((insight) => (
                  <div key={insight.id} className={`insight-item ${insight.isPinned ? 'pinned' : ''}`}>
                    <p className="insight-content">{insight.content}</p>
                    {insight.imageUrl && (
                      <img src={insight.imageUrl} alt="insight" className="insight-image" />
                    )}
                    <div className="insight-actions">
                      <button onClick={() => onTogglePin(link.id, insight.id, !insight.isPinned)}>
                        {insight.isPinned ? '📌 고정 해제' : '📌 고정'}
                      </button>
                      <button onClick={() => onRemoveInsight(link.id, insight.id)}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
              <form className="insight-form" onSubmit={handleAddInsight}>
                <textarea
                  placeholder="인사이트를 남겨보세요..."
                  value={insightText}
                  onChange={(e) => setInsightText(e.target.value)}
                  rows={2}
                />
                <div className="insight-form-actions">
                  <label className="btn-image-upload">
                    🖼 사진
                    <input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files?.[0])} />
                  </label>
                  {imageFile && <span className="image-selected">✓ {imageFile.name}</span>}
                  <button type="submit" className="btn-primary">저장</button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'retro' && (
            <div className="retro-section">
              {editingRetro ? (
                <>
                  <textarea
                    className="retro-textarea"
                    placeholder="이 링크를 통해 무엇을 배웠나요? 실제로 적용해봤나요?"
                    value={retrospective}
                    onChange={(e) => setRetrospective(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn-cancel" onClick={() => setEditingRetro(false)}>취소</button>
                    <button className="btn-primary" onClick={handleSaveRetro}>저장</button>
                  </div>
                </>
              ) : (
                <div className="retro-view" onClick={() => setEditingRetro(true)}>
                  {link.retrospective ? (
                    <p className="retro-content">{link.retrospective}</p>
                  ) : (
                    <p className="retro-empty">클릭해서 회고를 작성해보세요...</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="link-card-footer">
            <button className="btn-remove" onClick={() => onRemove(link.id)}>링크 삭제</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkCard;
