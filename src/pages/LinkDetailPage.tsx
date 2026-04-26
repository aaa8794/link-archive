import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useInsights from '../hooks/useInsights';
import { Link } from '../types';
import { normalizeImageUrlInput, isLikelyImageUrl, uploadLinkImageFile } from '../lib/linkImageUpload';

const BackIcon = () => <img src="/ic-back.png" width={24} height={24} alt="" />;

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const getDomain = (url: string) => {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) return `오늘 ${time}`;
  if (isYesterday) return `어제 ${time}`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
};

interface OgData {
  title: string;
  image: string | null;
  description: string | null;
}

interface Props {
  userId: string;
}

const LinkDetailPage: React.FC<Props> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<Link | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);

  // AI summary
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Memo editing
  const [memo, setMemo] = useState('');
  const memoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [editImageError, setEditImageError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Insight input
  const [insightInput, setInsightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [gradientPulse, setGradientPulse] = useState(false);

  const { insights, addInsight, removeInsight } = useInsights(id ?? '', userId);

  // Fetch single link
  useEffect(() => {
    if (!id) return;
    setLoadingLink(true);
    supabase.from('links').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const l: Link = {
          id: data.id,
          title: data.title,
          url: data.url,
          ogImage: data.og_image ?? undefined,
          images: data.images ?? [],
          description: data.og_description ?? undefined,
          memo: data.memo ?? undefined,
          liked: data.liked ?? false,
          status: data.status ?? 'saved',
          tags: data.tags ?? [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          userId: data.user_id,
          folderId: data.folder_id,
        };
        setLink(l);
        setMemo(l.memo ?? '');
        setEditTitle(l.title);
        setEditUrl(l.url);
        setEditTags(l.tags.join(', '));
        setEditImages(l.images ?? []);
      }
      setLoadingLink(false);
    });
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [link?.id]);

  // Fetch AI summary once link is loaded
  useEffect(() => {
    if (!link) return;
    setAiLoading(true);
    fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: link.url, title: link.title, description: link.description }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) setAiSummary(Array.isArray(data.summary) ? data.summary : [data.summary]);
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link?.id]);

  const updateLinkInDb = async (linkId: string, updates: Record<string, any>) => {
    await supabase.from('links').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', linkId);
  };

  const fetchOgMetadata = async (rawUrl: string) => {
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const res = await fetch('/api/og', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fullUrl }),
    });

    if (!res.ok) {
      throw new Error('메타 정보를 가져오지 못했어요.');
    }

    return res.json() as Promise<OgData>;
  };

  const updateLinkStatus = async (linkId: string, insightCount: number) => {
    const status = insightCount >= 2 ? 'expanded' : insightCount === 1 ? 'insight' : 'saved';
    await supabase.from('links').update({ status, updated_at: new Date().toISOString() }).eq('id', linkId);
    setLink((prev) => prev ? { ...prev, status } : prev);
  };

  // Auto-save memo with debounce
  const handleMemoChange = (value: string) => {
    setMemo(value);
    if (memoSaveTimer.current) clearTimeout(memoSaveTimer.current);
    memoSaveTimer.current = setTimeout(() => {
      if (link) {
        updateLinkInDb(link.id, { memo: value });
        setLink((prev) => prev ? { ...prev, memo: value } : prev);
      }
    }, 800);
  };

  const resetEditState = (currentLink: Link) => {
    setEditTitle(currentLink.title);
    setEditUrl(currentLink.url);
    setEditTags(currentLink.tags.join(', '));
    setEditImages(currentLink.images ?? []);
    setEditImageUrlInput('');
    setEditImageError('');
  };

  const handleStartEdit = () => {
    if (!link) return;
    resetEditState(link);
    setSavingEdit(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!link) return;
    resetEditState(link);
    setSavingEdit(false);
    setIsEditing(false);
  };

  const handleAddEditImageUrl = () => {
    const normalized = normalizeImageUrlInput(editImageUrlInput);
    if (!normalized || !isLikelyImageUrl(normalized)) {
      setEditImageError('이미지 URL을 확인해주세요.');
      return;
    }

    setEditImages((prev) => [...prev, normalized]);
    setEditImageUrlInput('');
    setEditImageError('');
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (!userId) {
      setEditImageError('로그인 후 이미지 업로드를 사용할 수 있어요.');
      e.target.value = '';
      return;
    }

    setUploadingImages(true);
    setEditImageError('');

    try {
      const uploaded = await Promise.all(files.map((file) => uploadLinkImageFile(userId, file)));
      setEditImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      setEditImageError(error instanceof Error ? error.message : '일부 이미지 업로드에 실패했어요.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!link) return;
    const normalizedUrl = editUrl.trim();
    if (!editTitle.trim() || !normalizedUrl) return;

    const fullUrl = normalizedUrl.startsWith('http') ? normalizedUrl : `https://${normalizedUrl}`;
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    setSavingEdit(true);

    try {
      let nextOgImage = link.ogImage;
      let nextDescription = link.description;

      if (fullUrl !== link.url) {
        try {
          const og = await fetchOgMetadata(fullUrl);
          nextOgImage = og.image || nextOgImage;
          nextDescription = og.description || nextDescription;
        } catch {
          // Keep existing metadata when refresh fails.
        }
      }

      await updateLinkInDb(link.id, {
        title: editTitle.trim(),
        url: fullUrl,
        tags,
        images: editImages,
        og_image: nextOgImage || null,
        og_description: nextDescription || null,
      });

      const updatedLink: Link = {
        ...link,
        title: editTitle.trim(),
        url: fullUrl,
        tags,
        images: editImages,
        ogImage: nextOgImage,
        description: nextDescription,
        updatedAt: new Date().toISOString(),
      };

      setLink(updatedLink);
      setActiveImageIndex(0);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddInsight = async () => {
    if (!insightInput.trim() || !link) return;
    setSaving(true);
    const ok = await addInsight(insightInput.trim());
    if (ok) {
      const newCount = insights.length + 1;
      await updateLinkStatus(link.id, newCount);
      setInsightInput('');
      setGradientPulse(true);
      window.setTimeout(() => setGradientPulse(false), 1800);
    }
    setSaving(false);
  };

  const handleRemoveInsight = async (insightId: string) => {
    await removeInsight(insightId);
    const newCount = Math.max(0, insights.length - 1);
    if (link) await updateLinkStatus(link.id, newCount);
  };

  const handleRemoveLink = async () => {
    if (!link) return;
    if (window.confirm('이 링크를 삭제할까요?')) {
      await supabase.from('links').delete().eq('id', link.id);
      navigate(-1);
    }
  };

  if (loadingLink) {
    return (
      <div className="ldp-loading">
        <span>불러오는 중...</span>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="ldp-loading">
        <span>링크를 찾을 수 없어요.</span>
        <button className="btn-secondary" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  const insightCount = insights.length;
  const progressSteps = [1, 2, 3];
  const gradientStage = insightCount >= 3 ? 3 : insightCount;
  const attachedImages = link.images ?? [];
  const displayImages = attachedImages.length > 0 ? attachedImages : link.ogImage ? [link.ogImage] : [];
  const hasCarouselImages = displayImages.length > 0;

  return (
    <div className="ldp-root">
      <div className="ldp-page-shell">
        <main className="ldp-main-column">
          <section className="ldp-main-card">
            <div className={`ldp-hero ldp-hero-stage-${gradientStage} ${gradientPulse ? 'is-pulsing' : ''}`}>
              <div className="ldp-hero-field" aria-hidden="true">
                <span className="ldp-hero-blob ldp-hero-blob-a" />
                <span className="ldp-hero-blob ldp-hero-blob-b" />
                <span className="ldp-hero-blob ldp-hero-blob-c" />
              </div>
              <button className="ldp-back" onClick={() => navigate(-1)}>
                <BackIcon />
                <span>돌아가기</span>
              </button>
              <div className="ldp-progress">
                <div className="ldp-progress-track">
                  {progressSteps.map((step) => (
                    <React.Fragment key={step}>
                      {insightCount >= step ? (
                        <img
                          src={`/Union${step === 1 ? '' : `-${step - 1}`}.png`}
                          className="ldp-progress-flower"
                          alt=""
                        />
                      ) : (
                        <img src="/empty-ic-archivo.png" className="ldp-progress-flower" alt="" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <span className="ldp-progress-label">나의 인사이트 {insightCount}개</span>
              </div>
            </div>

            <div className="ldp-card-body">
              <div className="ldp-title-section">
                {isEditing ? (
                  <div className="ldp-edit-form">
                    <input
                      className="ldp-edit-title-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                    />
                    <input
                      className="ldp-edit-tags-input"
                      placeholder="태그 (쉼표로 구분)"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                    />
                    <div className="ldp-edit-actions">
                      <button className="btn-cancel" onClick={handleCancelEdit}>취소</button>
                      <button className="btn-primary" onClick={handleSaveEdit} disabled={savingEdit || uploadingImages || !editTitle.trim() || !editUrl.trim()}>
                        {savingEdit ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ldp-title-row">
                      <h1 className="ldp-title">{link.title}</h1>
                      <button className="ldp-edit-text-btn" onClick={handleStartEdit}>
                        수정
                      </button>
                    </div>
                    <div className="ldp-meta">
                      <span className="ldp-meta-date">{formatDate(link.createdAt)}</span>
                      <span className="ldp-meta-sep">·</span>
                      <span className="ldp-meta-domain">{getDomain(link.url)}</span>
                    </div>
                    {link.tags.length > 0 && (
                      <div className="ldp-tags">
                        {link.tags.map((tag) => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isEditing ? (
                <div className="ldp-url-edit-wrap">
                  <span className="ldp-inline-label">링크</span>
                  <input
                    className="ldp-edit-url-bar"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="링크 URL"
                  />
                </div>
              ) : (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="ldp-url-bar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="ldp-url-text">{link.url}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              <div className="ldp-content-row">
                <div className="ldp-image-panel">
                  <span className="ldp-panel-label">이미지</span>
                  {isEditing ? (
                    <div className="ldp-image-editor">
                      {editImages.length > 0 ? (
                        <div className="ldp-edit-image-list">
                          {editImages.map((image, index) => (
                            <div key={`${image}-${index}`} className="ldp-edit-image-item">
                              <img src={image} alt="" className="ldp-edit-image-thumb" />
                              <button
                                type="button"
                                className="ldp-edit-image-remove"
                                onClick={() => handleRemoveEditImage(index)}
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : link.ogImage ? (
                        <div className="ldp-fallback-preview">
                          <img src={link.ogImage} alt="" className="ldp-fallback-preview-image" />
                          <p className="ldp-fallback-preview-note">현재 링크 썸네일이 표시되고 있어요. 직접 이미지를 추가하면 그 이미지가 우선됩니다.</p>
                        </div>
                      ) : (
                        <div className="ldp-image-placeholder" aria-hidden="true">
                          <div className="ldp-image-placeholder-grid" />
                        </div>
                      )}

                      <div className="ldp-edit-image-tools">
                        <label className="add-link-upload-button ldp-edit-upload-button">
                          <input type="file" accept="image/*" multiple onChange={handleEditFileChange} />
                          <span>{uploadingImages ? '업로드 중...' : '파일 업로드'}</span>
                        </label>

                        <div className="add-link-image-url-row">
                          <input
                            type="text"
                            placeholder="이미지 URL 추가"
                            value={editImageUrlInput}
                            onChange={(e) => setEditImageUrlInput(e.target.value)}
                          />
                          <button type="button" className="btn-secondary" onClick={handleAddEditImageUrl}>
                            추가
                          </button>
                        </div>

                        {editImageError && <p className="add-link-image-error">{editImageError}</p>}
                      </div>
                    </div>
                  ) : hasCarouselImages ? (
                    <div className="ldp-carousel">
                      <img
                        src={displayImages[activeImageIndex]}
                        alt={`${link.title} 이미지 ${activeImageIndex + 1}`}
                        className="ldp-og-img"
                      />
                      {displayImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="ldp-carousel-arrow ldp-carousel-arrow-left"
                            onClick={() => setActiveImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                            aria-label="이전 이미지"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="ldp-carousel-arrow ldp-carousel-arrow-right"
                            onClick={() => setActiveImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                            aria-label="다음 이미지"
                          >
                            ›
                          </button>
                          <div className="ldp-carousel-dots">
                            {displayImages.map((_, index) => (
                              <button
                                key={`dot-${index}`}
                                type="button"
                                className={`ldp-carousel-dot ${index === activeImageIndex ? 'active' : ''}`}
                                onClick={() => setActiveImageIndex(index)}
                                aria-label={`${index + 1}번 이미지로 이동`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="ldp-image-placeholder" aria-hidden="true">
                      <div className="ldp-image-placeholder-grid" />
                      <div className="ldp-image-placeholder-dots">
                        <span className="active" />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                </div>
                <div className="ldp-memo-panel">
                  <span className="ldp-panel-label">메모</span>
                  <textarea
                    className="ldp-memo-textarea"
                    placeholder="이곳에서 메모를 입력할 수 있어요. 수정은 바로 반영됩니다."
                    value={memo}
                    onChange={(e) => handleMemoChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="ldp-footer">
                <button className="btn-remove ldp-delete-btn" onClick={handleRemoveLink}>
                  <TrashIcon /> 링크 삭제
                </button>
              </div>
            </div>
          </section>
        </main>

        <aside className="ldp-right-rail">
          <div className="ldp-sidebar-section">
            <h3 className="ldp-sidebar-title">AI 링크 및 인사이트 요약</h3>
            <div className="ldp-ai-box">
              {aiLoading ? (
                <p className="ldp-ai-loading">요약 생성 중...</p>
              ) : aiSummary ? (
                <ul className="ldp-ai-list">
                  {aiSummary.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="ldp-ai-empty">요약을 불러올 수 없어요.</p>
              )}
            </div>
          </div>

          <div className="ldp-sidebar-section ldp-insights-section">
            <h3 className="ldp-sidebar-title">나의 인사이트</h3>
            {insights.length === 0 ? (
              <p className="ldp-insights-empty">아직 인사이트가 없어요.<br />이 링크에서 무엇을 느꼈나요?</p>
            ) : (
              <div className="ldp-insights-list">
                {insights.map((insight) => (
                  <div key={insight.id} className="ldp-insight-card">
                    <div className="ldp-insight-body">
                      <p className="ldp-insight-content">{insight.content}</p>
                      <span className="ldp-insight-time">{formatTime(insight.createdAt)}</span>
                    </div>
                    <button
                      className="ldp-insight-remove"
                      onClick={() => handleRemoveInsight(insight.id)}
                      aria-label="인사이트 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ldp-insight-input-section">
            <label className="ldp-sidebar-title">인사이트</label>
            <div className="ldp-insight-input-wrap">
              <textarea
                className="ldp-insight-textarea"
                placeholder="인사이트를 입력해주세요"
                value={insightInput}
                onChange={(e) => setInsightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddInsight();
                }}
                rows={3}
              />
              <button
                className="btn-primary ldp-insight-save-btn"
                onClick={handleAddInsight}
                disabled={!insightInput.trim() || saving}
              >
                {saving ? '저장 중...' : '인사이트 저장'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LinkDetailPage;
