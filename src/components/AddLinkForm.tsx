import React, { useState } from 'react';
import { normalizeImageUrlInput, isLikelyImageUrl, uploadLinkImageFile } from '../lib/linkImageUpload';
import { Folder } from '../types';

interface OgData {
  title: string;
  image: string | null;
  description: string | null;
}

interface AddLinkFormProps {
  onAdd: (title: string, url: string, ogImage?: string, description?: string, folderId?: string, images?: string[]) => void;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId?: string;
  userId?: string;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ onAdd, onClose, folders, defaultFolderId, userId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState('');

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
    onAdd(finalTitle, fullUrl, ogImage || undefined, description.trim() || undefined, folderId || undefined, images);
    onClose();
  };

  const handleAddImageUrl = () => {
    const normalized = normalizeImageUrlInput(imageUrlInput);
    if (!normalized || !isLikelyImageUrl(normalized)) {
      setImageError('이미지 URL을 확인해주세요.');
      return;
    }

    setImages((prev) => [...prev, normalized]);
    setImageUrlInput('');
    setImageError('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (!userId) {
      setImageError('로그인 후 이미지 업로드를 사용할 수 있어요.');
      e.target.value = '';
      return;
    }

    setUploadingImages(true);
    setImageError('');

    try {
      const uploaded = await Promise.all(files.map((file) => uploadLinkImageFile(userId, file)));
      setImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '일부 이미지 업로드에 실패했어요.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

          <div className="add-link-images">
            <div className="add-link-images-header">
              <label className="add-link-images-label">이미지</label>
              <span className="add-link-images-help">선택, 여러 장 가능</span>
            </div>

            <label className="add-link-upload-button">
              <input type="file" accept="image/*" multiple onChange={handleFileChange} />
              <span>{uploadingImages ? '업로드 중...' : '파일 업로드'}</span>
            </label>

            <div className="add-link-image-url-row">
              <input
                type="text"
                placeholder="이미지 URL 추가"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                aria-label="이미지 URL"
              />
              <button type="button" className="btn-secondary" onClick={handleAddImageUrl}>
                추가
              </button>
            </div>

            {imageError && <p className="add-link-image-error">{imageError}</p>}

            {images.length > 0 && (
              <div className="add-link-image-preview-list">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="add-link-image-preview-item">
                    <img src={image} alt="" className="add-link-image-preview" />
                    <button
                      type="button"
                      className="add-link-image-remove"
                      onClick={() => handleRemoveImage(index)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary" disabled={fetching || uploadingImages || !url.trim()}>추가</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkForm;
