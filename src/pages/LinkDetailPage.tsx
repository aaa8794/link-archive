import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useInsights from '../hooks/useInsights';
import { Link } from '../types';

const BackIcon = () => <img src="/ic-back.png" width={24} height={24} alt="" />;
const EditIcon = () => <img src="/ic-edit.png" width={20} height={20} alt="" />;

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
  const [editTags, setEditTags] = useState('');

  // Insight input
  const [insightInput, setInsightInput] = useState('');
  const [saving, setSaving] = useState(false);

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
        setEditTags(l.tags.join(', '));
      }
      setLoadingLink(false);
    });
  }, [id]);

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

  const handleSaveEdit = () => {
    if (!link) return;
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    updateLinkInDb(link.id, { title: editTitle, tags });
    setLink((prev) => prev ? { ...prev, title: editTitle, tags } : prev);
    setIsEditing(false);
  };

  const handleAddInsight = async () => {
    if (!insightInput.trim() || !link) return;
    setSaving(true);
    const ok = await addInsight(insightInput.trim());
    if (ok) {
      const newCount = insights.length + 1;
      await updateLinkStatus(link.id, newCount);
      setInsightInput('');
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

  return (
    <div className="ldp-root">
      <header className="ldp-page-header">
        <div className="ldp-page-brand">
          <img src="/Archivologo.svg" alt="archiv*o" className="ldp-page-logo" />
        </div>
        <div className="ldp-page-actions">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            로그인
          </button>
          <button className="btn-primary" onClick={() => navigate('/archive')}>
            + 링크 추가
          </button>
        </div>
      </header>

      <div className="ldp-page-shell">
        <main className="ldp-main-column">
          <section className="ldp-main-card">
            <div className="ldp-hero">
              <button className="ldp-back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
                <BackIcon />
              </button>
              <div className="ldp-progress">
                <div className="ldp-progress-track">
                  {progressSteps.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={`ldp-progress-dot ${insightCount >= step ? 'filled' : ''}`} />
                      {i < progressSteps.length - 1 && (
                        <div className={`ldp-progress-line ${insightCount > step ? 'filled' : ''}`} />
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
                      <button className="btn-cancel" onClick={() => setIsEditing(false)}>취소</button>
                      <button className="btn-primary" onClick={handleSaveEdit}>저장</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ldp-title-row">
                      <h1 className="ldp-title">{link.title}</h1>
                      <button className="btn-icon ldp-edit-btn" onClick={() => setIsEditing(true)}>
                        <EditIcon />
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

              <div className="ldp-content-row">
                <div className="ldp-image-panel">
                  <span className="ldp-panel-label">이미지</span>
                  {link.ogImage ? (
                    <img src={link.ogImage} alt={link.title} className="ldp-og-img" />
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
