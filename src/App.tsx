import React, { useState } from 'react';
import './App.css';
import LinkCard from './components/LinkCard';
import AddLinkForm from './components/AddLinkForm';
import useLinks from './hooks/useLinks';
import { Link, Stage } from './types';

const COLUMNS: { stage: Stage; label: string; emoji: string }[] = [
  { stage: 'saved', label: '저장', emoji: '📌' },
  { stage: 'in-progress', label: '진행중', emoji: '🔄' },
  { stage: 'done', label: '실행', emoji: '✅' },
];

const App: React.FC = () => {
  const { links, addLink, moveLink, removeLink } = useLinks();
  const [showForm, setShowForm] = useState(false);

  const byStage = (stage: Stage): Link[] =>
    links.filter((l) => l.stage === stage);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Link Archive</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + 링크 추가
        </button>
      </header>

      <main className="board">
        {COLUMNS.map(({ stage, label, emoji }) => (
          <div key={stage} className="column">
            <div className="column-header">
              <span className="column-emoji">{emoji}</span>
              <span className="column-label">{label}</span>
              <span className="column-count">{byStage(stage).length}</span>
            </div>
            <div className="column-body">
              {byStage(stage).length === 0 ? (
                <p className="empty-hint">비어 있어요</p>
              ) : (
                byStage(stage).map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onMove={moveLink}
                    onRemove={removeLink}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </main>

      {showForm && (
        <AddLinkForm onAdd={addLink} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default App;
