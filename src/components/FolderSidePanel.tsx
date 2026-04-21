import React, { useState, useMemo } from 'react';
import { Folder, Link } from '../types';

interface Props {
  folder: Folder;
  links: Link[];
}

const STATUS_COLORS: Record<string, string[]> = {
  saved:    ['#D4D4D4', '#E0E7FF'],
  insight:  ['#A5B4FC', '#818CF8'],
  expanded: ['#6366F1', '#3B3EED'],
};

const FolderSidePanel: React.FC<Props> = ({ folder, links }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // derive gradient color stops from link status distribution
  const gradientColors = useMemo(() => {
    if (links.length === 0) return ['#E0E7FF', '#C7D2FE', '#A5B4FC'];
    const all: string[] = [];
    links.forEach((l) => {
      const cols = STATUS_COLORS[l.status] ?? STATUS_COLORS.saved;
      all.push(...cols);
    });
    // deduplicate while preserving order
    return [...new Set(all)].slice(0, 6);
  }, [links]);

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
    backgroundSize: '400% 400%',
  };

  const handleGenerate = async () => {
    if (loading || links.length === 0) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links, mode: 'folder' }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('요약 생성에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const insightLinks = links.filter((l) => l.insight || l.idea);

  return (
    <aside className="folder-side-panel">
      {/* Animated gradient cover */}
      <div className="folder-cover" style={gradientStyle}>
        <div className="folder-cover-glass">
          <span className="folder-cover-name">{folder.name}</span>
          <span className="folder-cover-count">{links.length}개의 링크</span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="folder-panel-section">
        <div className="folder-panel-section-header">
          <span className="folder-panel-section-title">AI 분석</span>
          <button
            className={`btn-ai-generate ${loading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={loading || links.length === 0}
          >
            {loading ? '분석 중...' : summary ? '다시 생성' : '생성하기'}
          </button>
        </div>
        {summary && (
          <div className="folder-ai-summary">
            {summary.split('\n').map((line, i) => (
              <p key={i} className="folder-ai-summary-line">{line}</p>
            ))}
          </div>
        )}
        {!summary && !loading && (
          <p className="folder-panel-empty">이 폴더의 링크들을 분석해 주제와 생각의 흐름을 파악해드릴게요.</p>
        )}
      </div>

      {/* User insights from links */}
      {insightLinks.length > 0 && (
        <div className="folder-panel-section">
          <div className="folder-panel-section-header">
            <span className="folder-panel-section-title">인사이트 모음</span>
          </div>
          <div className="folder-insight-list">
            {insightLinks.map((l) => (
              <div key={l.id} className="folder-insight-item">
                <span className="folder-insight-link-title">{l.title}</span>
                {l.insight && <p className="folder-insight-text">"{l.insight}"</p>}
                {l.idea && <p className="folder-idea-text">{l.idea}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default FolderSidePanel;
