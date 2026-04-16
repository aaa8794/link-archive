import React, { useState } from 'react';
import { Folder } from '../types';

interface OgData {
  title: string;
  image: string | null;
  description: string | null;
}

interface AddLinkFormProps {
  onAdd: (title: string, url: string, ogImage?: string, description?: string, folderId?: string) => void;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId?: string;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ onAdd, onClose, folders, defaultFolderId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchOg = async (rawUrl: string) => {
    if (!rawUrl.trim()) return;
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    setFetching(true);
    try {
      const res = await fetch('/api/og', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl }),
      });
      if (res.ok) {
        const data: OgData = await res.json();
        if (data.title && !title) setTitle(data.title);
        if (data.image) setOgImage(data.image);
        if (data.description && !description) setDescription(data.description);
      }
    } catch {
      // ignore fetch errors
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const finalTitle = title.trim() || fullUrl;
    onAdd(finalTitle, fullUrl, ogImage || undefined, description.trim() || undefined, folderId || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>링크 추가</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="url"
            autoComplete="url"
            placeholder="URL (예: notion.so/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => fetchOg(url)}
            spellCheck={false}
            aria-label="URL"
            autoFocus
            required
          />

          {fetching && <p className="og-fetching">정보를 불러오는 중…</p>}

          {ogImage && (
            <div className="og-preview">
              <img src={ogImage} alt="링크 미리보기" className="og-preview-img" />
            </div>
          )}

          <input
            type="text"
            name="title"
            autoComplete="off"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="제목"
            required
          />

          <input
            type="text"
            name="memo"
            autoComplete="off"
            placeholder="메모 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="메모"
          />

          {folders.length > 0 && (
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              aria-label="폴더 선택"
            >
              <option value="">폴더 없음</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary" disabled={fetching || !url.trim()}>추가</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkForm;
