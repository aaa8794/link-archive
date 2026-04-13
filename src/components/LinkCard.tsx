import React, { useState } from 'react';
import { Link, Insight } from '../types';

interface LinkCardProps {
  link: Link;
  insights: Insight[];
  onToggleLike: (id: string, liked: boolean) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onAddInsight: (linkId: string, content: string, imageFile?: File) => void;
  onTogglePin: (linkId: string, insightId: string, isPinned: boolean) => void;
  onRemoveInsight: (linkId: string, insightId: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
  link, insights, onToggleLike, onRemove, onExpand,
  isExpanded, onAddInsight, onTogglePin, onRemoveInsight,
}) => {
  const [insightText, setInsightText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>();
  const pinnedInsight = insights.find((i) => i.isPinned);

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightText.trim()) return;
    await onAddInsight(link.id, insightText.trim(), imageFile);
    setInsightText('');
    setImageFile(undefined);
  };

  return (
    <div className={`link-card ${link.liked ? 'liked' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {/* 카드 헤더 */}
      <div className="link-card-main" onClick={() => onExpand(link.id)}>
        <div className="link-card-body">
          <div className="link-card-top">
            <h3 className="link-title">{link.title}</h3>
            <button
              className={`btn-like ${link.liked ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleLike(link.id, !link.liked); }}
            >
              {link.liked ? '❤️' : '🤍'}
            </button>
          </div>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url" onClick={(e) => e.stopPropagation()}>
            {link.url}
          </a>
          {link.description && <p className="link-description">{link.description}</p>}
          {pinnedInsight && !isExpanded && (
            <div className="pinned-insight-preview">📌 {pinnedInsight.content}</div>
          )}
        </div>
      </div>

      {/* 펼쳐진 인사이트 영역 */}
      {isExpanded && (
        <div className="insight-section" onClick={(e) => e.stopPropagation()}>
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

          <div className="link-card-footer">
            <button className="btn-remove" onClick={() => onRemove(link.id)}>링크 삭제</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkCard;
