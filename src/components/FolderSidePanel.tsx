import React, { useState, useMemo } from 'react';
import { Folder, Link } from '../types';
import { buildFolderCover } from '../lib/folderCover';

interface Props {
  folder: Folder;
  links: Link[];
}

const FolderSidePanel: React.FC<Props> = ({ folder, links }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cover = useMemo(() => buildFolderCover(folder.moodKey, links), [folder.moodKey, links]);

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

  return (
    <aside className="folder-side-panel">
      {/* Animated gradient cover */}
      <div
        className={`folder-cover ${cover.isEmpty ? 'is-empty' : ''} ${cover.hasImage ? 'has-image' : ''} tone-${cover.textTone}`}
        style={cover.style}
      >
        <div className="folder-cover-glass">
          <span className="folder-cover-name">{folder.name}</span>
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
    </aside>
  );
};

export default FolderSidePanel;
