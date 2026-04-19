import React, { useState, useEffect } from 'react';
import { Link, Insight, Folder } from '../types';

interface Props {
  link: Link;
  insights: Insight[];
  folders: Folder[];
  onClose: () => void;
  onUpdate: (id: string, updates: { title?: string; folderId?: string; tags?: string[]; retrospective?: string }) => void;
  onAddInsight: (linkId: string, content: string, imageFile?: File) => void;
  onTogglePin: (linkId: string, insightId: string, isPinned: boolean) => void;
  onRemoveInsight: (linkId: string, insightId: string) => void;
  onRemove: (id: string) => void;
}

const LinkDetailPanel: React.FC<Props> = ({
  link, insights, folders, onClose, onUpdate, onAddInsight, onTogglePin, onRemoveInsight, onRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'insight' | 'retro'>('insight');
  const [insightText, setInsightText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [retrospective, setRetrospective] = useState(link.retrospective || '');
  const [editingRetro, setEditingRetro] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editFolderId, setEditFolderId] = useState(link.folderId || '');
  const [editTags, setEditTags] = useState(link.tags.join(', '));

  useEffect(() => {
    setRetrospective(link.retrospective || '');
    setEditTitle(link.title);
    setEditFolderId(link.folderId || '');
    setEditTags(link.tags.join(', '));
  }, [link.id]);

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightText.trim()) return;
    onAddInsight(link.id, insightText.trim(), imageFile);
    setInsightText('');
    setImageFile(undefined);
  };

  const handleSaveRetro = () => {
    onUpdate(link.id, { retrospective });
    setEditingRetro(false);
  };

  const handleSaveEdit = () => {
    onUpdate(link.id, {
      title: editTitle,
      folderId: editFolderId || undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleAiSummary = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: [link] }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      setAiSummary('요약 생성에 실패했어요.');
    } finally {
      setAiLoading(false);
    }
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
                <button className="btn-icon" onClick={() => setIsEditing(true)}>✏️</button>
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

        {/* AI Summary */}
        <div className="detail-ai-section">
          <button
            className={`btn-ai-summary ${aiLoading ? 'loading' : ''}`}
            onClick={handleAiSummary}
            disabled={aiLoading}
          >
            {aiLoading ? '요약 중...' : '✨ AI 요약'}
          </button>
          {aiSummary && (
            <div className="detail-ai-summary">
              <p>{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar detail-tabs">
          <button className={`tab ${activeTab === 'insight' ? 'active' : ''}`} onClick={() => setActiveTab('insight')}>인사이트</button>
          <button className={`tab ${activeTab === 'retro' ? 'active' : ''}`} onClick={() => setActiveTab('retro')}>회고</button>
        </div>

        {/* Insight Tab */}
        {activeTab === 'insight' && (
          <div className="detail-tab-content">
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
                rows={3}
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
          </div>
        )}

        {/* Retro Tab */}
        {activeTab === 'retro' && (
          <div className="detail-tab-content retro-section">
            {editingRetro ? (
              <>
                <textarea
                  className="retro-textarea"
                  placeholder="이 링크를 통해 무엇을 배웠나요? 실제로 적용해봤나요?"
                  value={retrospective}
                  onChange={(e) => setRetrospective(e.target.value)}
                  rows={6}
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

        {/* Footer */}
        <div className="detail-footer">
          <button className="btn-remove" onClick={handleRemove}>링크 삭제</button>
        </div>
      </div>
    </div>
  );
};

export default LinkDetailPanel;
