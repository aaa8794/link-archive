import React from 'react';
import { Link, Stage } from '../types';

interface LinkCardProps {
  link: Link;
  onMove: (id: string, stage: Stage) => void;
  onRemove: (id: string) => void;
}

const NEXT_STAGE: Record<Stage, Stage | null> = {
  saved: 'in-progress',
  'in-progress': 'done',
  done: null,
};

const NEXT_LABEL: Record<Stage, string> = {
  saved: '진행중으로',
  'in-progress': '실행 완료',
  done: '',
};

const LinkCard: React.FC<LinkCardProps> = ({ link, onMove, onRemove }) => {
  const next = NEXT_STAGE[link.stage];

  return (
    <div className={`link-card stage-${link.stage}`}>
      <div className="link-card-body">
        <h3 className="link-title">{link.title}</h3>
        {link.description && (
          <p className="link-description">{link.description}</p>
        )}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-url"
        >
          {link.url}
        </a>
      </div>
      <div className="link-card-actions">
        {next && (
          <button
            className="btn-move"
            onClick={() => onMove(link.id, next)}
          >
            {NEXT_LABEL[link.stage]} →
          </button>
        )}
        <button className="btn-remove" onClick={() => onRemove(link.id)}>
          삭제
        </button>
      </div>
    </div>
  );
};

export default LinkCard;
