import React, { useState } from 'react';
import { Folder } from '../types';

interface AddLinkFormProps {
  onAdd: (title: string, url: string, description?: string, folderId?: string) => void;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId?: string;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ onAdd, onClose, folders, defaultFolderId }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    onAdd(title.trim(), fullUrl, description.trim() || undefined, folderId || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>링크 추가</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="URL (예: notion.so/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="메모 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {folders.length > 0 && (
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">폴더 없음</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">추가</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkForm;
