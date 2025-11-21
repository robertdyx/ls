// src/components/PostEditor.tsx
import { useState, useEffect } from 'react';
import ParagraphEditForm from './ParagraphEditForm';
import ImageGroupEditForm from './ImageGroupEditForm';
import PullQuoteEditForm from './PullQuoteEditForm';
import ImageEditForm from './ImageEditForm';
import ScrollytellingEditForm from './ScrollytellingEditForm';
import HeroEditForm from './HeroEditForm';
import { getApiBaseUrl } from '../lib/fetcher';

// 统一请求头（绕过 ngrok 免费域拦截 + 标记为 fetch 请求）
const JSON_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
  'Content-Type': 'application/json',
} as const;
const GET_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
} as const;

const API_BASE_URL = getApiBaseUrl();

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface PostEditorProps {
  embedded?: boolean;
  onClose?: () => void;
  onSectionsUpdated?: () => void;
}

export default function PostEditor({
  embedded = false,
  onClose,
  onSectionsUpdated,
}: PostEditorProps = {}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [storyId, setStoryId] = useState<number | null>(null);

  // ---- helpers ----
  const fetchAsJson = async (url: string) => {
    const res = await fetch(url, { headers: GET_HEADERS, mode: 'cors', credentials: 'omit' });
    const ctype = res.headers.get('content-type') || '';
    const isJson = ctype.includes('application/json');
    const payload = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const brief = typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200);
      throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
    }
    return payload;
  };

  const sendJson = async (url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: any) => {
    const res = await fetch(url, {
      method,
      headers: JSON_HEADERS,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      mode: 'cors',
      credentials: 'omit',
    });
    const ctype = res.headers.get('content-type') || '';
    const isJson = ctype.includes('application/json');
    const payload = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const brief = typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200);
      throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
    }
    return payload;
  };

  // 获取所有 sections
  const fetchSections = async (
    targetStoryId: number,
    options: { skipLoading?: boolean } = {}
  ) => {
    try {
      if (!options.skipLoading) setLoading(true);
      const data = await fetchAsJson(`${API_BASE_URL}/sections?story_id=${targetStoryId}`);
      setSections(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sections: ' + (err as Error).message);
    } finally {
      if (!options.skipLoading) setLoading(false);
    }
  };

  // 获取最新 story，确保拿到 storyId
  const fetchStoryMeta = async () => {
    try {
      setLoading(true);
      const data = await fetchAsJson(`${API_BASE_URL}/story`);
      if (typeof data.id !== 'number') {
        throw new Error('Story data is missing an id field');
      }
      setStoryId(data.id);
      await fetchSections(data.id, { skipLoading: true });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setSections([]);
      setStoryId(null);
      setShowCreateForm(false);
    } finally {
      setLoading(false);
    }
  };

  // 删除 section
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await sendJson(`${API_BASE_URL}/sections/${id}`, 'DELETE');
      setSections(sections.filter(section => section.id !== id));
      alert('Section deleted successfully!');
      onSectionsUpdated?.();
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message);
    }
  };

  // 编辑 section
  const handleEdit = (section: Section) => {
    setEditingSection(section);
  };

  useEffect(() => {
    fetchStoryMeta();
  }, []);

  const handleClose = () => {
    if (embedded) {
      onClose?.();
    } else if (onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  const containerClassName = embedded
    ? 'editor-container editor-container--embedded'
    : 'editor-container';

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <div className="editor-header">
        <h2>Section Management</h2>
        <div className="editor-actions">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={storyId === null}
            className={embedded ? 'editor-icon-button' : undefined}
            aria-label={showCreateForm ? 'Cancel new section' : 'Create new section'}
            title={showCreateForm ? 'Cancel new section' : 'Create new section'}
          >
            {embedded ? (
              <>
                {showCreateForm ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                <span className="sr-only">
                  {showCreateForm ? 'Cancel new section' : 'Create new section'}
                </span>
              </>
            ) : (
              showCreateForm ? 'Cancel' : 'Create New Section'
            )}
          </button>
          <button
            onClick={() => {
              if (storyId !== null) {
                fetchSections(storyId);
                onSectionsUpdated?.();
              }
            }}
            disabled={storyId === null}
            className={embedded ? 'editor-icon-button' : undefined}
            aria-label="Refresh sections"
            title="Refresh sections"
          >
            {embedded ? (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4v6h6M20 20v-6h-6M6 18a8 8 0 0 0 13.66-3M18 6a8 8 0 0 0-13.66 3" />
                </svg>
                <span className="sr-only">Refresh sections</span>
              </>
            ) : (
              'Refresh'
            )}
          </button>
          {(!embedded || !onClose) && (
            <button onClick={handleClose}>
              {embedded ? 'Close Editor' : 'Back'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && storyId !== null && (
        <CreateSectionForm
          storyId={storyId}
          onSuccess={async () => {
            setShowCreateForm(false);
            await fetchSections(storyId);
            onSectionsUpdated?.();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* 编辑弹窗 */}
      {editingSection && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, overflow: 'auto'
        }}>
          <div style={{
            background: 'white', borderRadius: '8px',
            width: '90%', maxWidth: '900px', maxHeight: '90vh',
            overflow: 'auto', position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* 关闭按钮 */}
            <button
              onClick={() => setEditingSection(null)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', background: '#dc3545', color: 'white',
                fontSize: '20px', cursor: 'pointer', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ×
            </button>
            <EditSectionForm
              section={editingSection}
              onSuccess={async () => {
                setEditingSection(null);
                if (storyId !== null) await fetchSections(storyId);
                onSectionsUpdated?.();
              }}
              onCancel={() => setEditingSection(null)}
            />
          </div>
        </div>
      )}

      <div className="posts-list">
        {sections.map(section => {
          let sectionData;
          try {
            sectionData = JSON.parse(section.data);
          } catch {
            sectionData = { type: section.type };
          }

          return (
            <div key={section.id} className="post-card">
              <div className="post-header">
                <h3>{section.type} (Story ID: {section.story_id})</h3>
                <div className="post-actions">
                  <button onClick={() => handleEdit(section)}>Edit</button>
                  <button onClick={() => handleDelete(section.id)} className="danger">Delete</button>
                </div>
              </div>
              <div className="post-content">
                <p>Type: {section.type}</p>
                <p>Sort Order: {section.sort_order}</p>
                {section.type === 'video' && sectionData.src && (
                  <div style={{ marginTop: '10px' }}>
                    <video src={sectionData.src} style={{ maxWidth: '200px', maxHeight: '150px' }} controls />
                  </div>
                )}
                <details>
                  <summary>View Data</summary>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      overflowY: 'auto', overflowX: 'hidden',
                      maxHeight: '260px', padding: '12px',
                      background: '#f8f9fa', borderRadius: '6px',
                      border: '1px solid #e0e0e0', marginTop: '8px'
                    }}
                  >
                    {JSON.stringify(sectionData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="empty-state">
          <p>No sections yet</p>
        </div>
      )}
    </div>
  );
}

// 创建 Section 表单
function CreateSectionForm({
  storyId, onSuccess, onCancel
}: { storyId: number; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: 'paragraph',
    data: '{"type":"paragraph","content":"<p>Content</p>"}',
    sort_order: 0
  });

  const handleTypeChange = (value: string) => {
    let defaultData = formData.data;
    if (value === 'hero') {
      defaultData = JSON.stringify({
        type: 'hero',
        title: '',
        standfirst: '',
        kicker: '',
        authorLine: '',
        backgroundColor: '#0b4635',
        textColor: '#ffffff',
        height: '360px',
        alignment: 'center'
      }, null, 2);
    } else if (value === 'paragraph') {
      defaultData = '{"type":"paragraph","content":"<p>Content</p>"}';
    }
    setFormData(prev => ({ ...prev, type: value, data: defaultData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/sections?story_id=${storyId}`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          type: formData.type,
          data: formData.data,
          sort_order: formData.sort_order
        })
      });

      alert('Section created successfully!');
      onSuccess();
    } catch (err) {
      alert('Failed to create: ' + (err as Error).message);
    }
  };

  return (
    <div className="form-container">
      <h3>Create New Section</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <select value={formData.type} onChange={e => handleTypeChange(e.target.value)}>
            <option value="paragraph">Paragraph</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="imagegroup">Image Group</option>
            <option value="pullquote">Pull Quote</option>
            <option value="scrollytelling">Scrollytelling</option>
            <option value="hero">Hero Block</option>
          </select>
        </div>
        <div className="form-group">
          <label>Data (JSON)</label>
          <textarea
            value={formData.data}
            onChange={e => setFormData({ ...formData, data: e.target.value })}
            rows={10}
            required
          />
        </div>
        <div className="form-group">
          <label>Sort Order</label>
          <input
            type="number"
            value={formData.sort_order}
            onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-actions">
          <button type="submit">Create</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// 编辑 Section 表单（含 Video 表单与上传逻辑，保留你的原实现，仅把 API 请求头/地址统一）
function EditSectionForm({
  section, onSuccess, onCancel
}: { section: Section; onSuccess: () => void; onCancel: () => void }) {
  if (section.type === 'video') {
    return <VideoEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'paragraph') {
    return <ParagraphEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'imagegroup') {
    return <ImageGroupEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'pullquote') {
    return <PullQuoteEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'image') {
    return <ImageEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'scrollytelling') {
    return <ScrollytellingEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  if (section.type === 'hero') {
    return <HeroEditForm section={section} onSuccess={onSuccess} onCancel={onCancel} />;
  }

  const [formData, setFormData] = useState({
    type: section.type,
    data: section.data,
    sort_order: section.sort_order
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(formData)
      });

      alert('Update successful!');
      onSuccess();
    } catch (err) {
      alert('Failed to update: ' + (err as Error).message);
    }
  };

  return (
    <div className="form-container">
      <h3>Edit Section</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <input
            type="text"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Data (JSON)</label>
          <textarea
            value={formData.data}
            onChange={e => setFormData({ ...formData, data: e.target.value })}
            rows={15}
            required
          />
        </div>
        <div className="form-group">
          <label>Sort Order</label>
          <input
            type="number"
            value={formData.sort_order}
            onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// Video 专用编辑表单（保留你的实现，只把上传与保存请求加上统一 headers）
function VideoEditForm({
  section, onSuccess, onCancel
}: { section: Section; onSuccess: () => void; onCancel: () => void }) {
  let initialData: any;
  try {
    initialData = JSON.parse(section.data);
  } catch {
    initialData = { type: 'video', src: '', poster: '', autoplay: false, loop: false, muted: false };
  }

  const [formData, setFormData] = useState({
    type: 'video',
    src: initialData.src || '',
    poster: initialData.poster || '',
    captions: initialData.captions || '',
    autoplay: Boolean(initialData.autoplay),
    loop: Boolean(initialData.loop),
    muted: Boolean(initialData.muted),
    credit: initialData.credit || ''
  });

  const [uploadingSrc, setUploadingSrc] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingCaptions, setUploadingCaptions] = useState(false);

  // 上传文件（视频或图片）
  const handleFileUpload = async (file: File, field: 'src' | 'poster') => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (field === 'src' && !isVideo) return alert('Please select a video file');
    if (field === 'poster' && !isImage) return alert('Please select an image file');

    try {
      const uploadingSetter = field === 'src' ? setUploadingSrc : setUploadingPoster;
      uploadingSetter(true);

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const targetPath = `/media/uploads/${fileName}`;

      const form = new FormData();
      form.append('file', file);
      form.append('target_path', targetPath);

      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: form, headers: { 'ngrok-skip-browser-warning': '1', 'x-requested-with': 'fetch' } });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err.slice(0, 200));
      }
      const result = await res.json();
      const fileUrl = result.url;

      if (field === 'src') setFormData(prev => ({ ...prev, src: fileUrl }));
      else setFormData(prev => ({ ...prev, poster: fileUrl }));

      alert(`Upload successful! File saved to: ${fileUrl}`);
      uploadingSetter(false);
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
      const uploadingSetter = field === 'src' ? setUploadingSrc : setUploadingPoster;
      uploadingSetter(false);
    }
  };

  // 上传字幕文件（.vtt / .srt）
  const handleCaptionsUpload = async (file: File) => {
    if (!file) return;
    const valid = file.name.toLowerCase().endsWith('.vtt') || file.name.toLowerCase().endsWith('.srt');
    if (!valid) return alert('Please upload a .vtt or .srt file');

    try {
      setUploadingCaptions(true);

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const targetPath = `/media/uploads/${fileName}`;

      const form = new FormData();
      form.append('file', file);
      form.append('target_path', targetPath);

      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: form, headers: { 'ngrok-skip-browser-warning': '1', 'x-requested-with': 'fetch' } });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err.slice(0, 200));
      }
      const result = await res.json();

      setFormData(prev => ({ ...prev, captions: result.url }));
      alert('Captions uploaded successfully!');
    } catch (err) {
      alert('Failed to upload captions: ' + (err as Error).message);
    } finally {
      setUploadingCaptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataJson = JSON.stringify(formData, null, 2);
      await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          type: formData.type,
          data: dataJson,
          sort_order: section.sort_order
        })
      });

      alert('Update successful!');
      onSuccess();
    } catch (err) {
      alert('Failed to update: ' + (err as Error).message);
    }
  };

  const getYoutubeId = (s: string) => {
    try {
      const u = new URL(s);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    } catch {}
    return null;
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px', margin: '40px 20px 20px 20px' }}>
      <h3>Edit Video Section</h3>
      <form onSubmit={handleSubmit}>
        {/* 下面表单与你原逻辑一致 */}
        <div className="form-group">
          <label>Video URL (src)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input
              type="text"
              value={formData.src}
              onChange={e => setFormData({ ...formData, src: e.target.value })}
              placeholder="e.g.: /media/demo/hero.mp4"
              style={{ flex: 1 }}
            />
            <div>
              <input type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'src'); }} style={{ display: 'none' }} id="video-upload" />
              <label htmlFor="video-upload" className="upload-button">{uploadingSrc ? 'Uploading...' : '📤 Upload Video'}</label>
            </div>
          </div>

          {formData.src && (
            <div style={{ marginTop: '10px' }}>
              {(() => {
                const id = getYoutubeId(formData.src);
                if (id) {
                  const qs = new URLSearchParams({ rel: '0', playsinline: '1' });
                  const embed = `https://www.youtube.com/embed/${id}?${qs.toString()}`;
                  return (
                    <iframe
                      src={embed}
                      title="YouTube preview"
                      style={{ width: 300, height: 200, border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  );
                }
                return <video src={formData.src} controls style={{ maxWidth: 300, maxHeight: 200 }} preload="metadata" />;
              })()}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Poster URL (poster)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input type="text" value={formData.poster} onChange={e => setFormData({ ...formData, poster: e.target.value })} placeholder="e.g.: /media/demo/poster.jpg" style={{ flex: 1 }} />
            <div>
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'poster'); }} style={{ display: 'none' }} id="poster-upload" />
              <label htmlFor="poster-upload" className="upload-button">{uploadingPoster ? 'Uploading...' : '📤 Upload Image'}</label>
            </div>
          </div>
          {formData.poster && <div style={{ marginTop: '10px' }}><img src={formData.poster} alt="Poster" style={{ maxWidth: '300px', maxHeight: '200px' }} /></div>}
        </div>

        <div className="form-group">
          <label>Captions URL (optional)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input type="text" value={formData.captions} onChange={e => setFormData({ ...formData, captions: e.target.value })} placeholder="e.g.: /media/demo/captions.vtt" style={{ flex: 1 }} />
            <div>
              <input type="file" accept=".vtt,.srt,text/vtt,application/x-subrip" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCaptionsUpload(file); }} style={{ display: 'none' }} id="captions-upload" />
              <label htmlFor="captions-upload" className="upload-button">{uploadingCaptions ? 'Uploading...' : '📤 Upload Captions'}</label>
            </div>
          </div>
          {formData.captions && <div style={{ marginTop: '8px', fontSize: '13px', color: '#555' }}>Current file: {formData.captions}</div>}
        </div>

        <div className="form-group">
          <label>Credit (optional)</label>
          <input type="text" value={formData.credit} onChange={e => setFormData({ ...formData, credit: e.target.value })} placeholder="Video: Coast Guard Maritime Operations / John Doe" />
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={formData.autoplay} onChange={e => setFormData({ ...formData, autoplay: e.target.checked })} />
            Autoplay
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={formData.loop} onChange={e => setFormData({ ...formData, loop: e.target.checked })} />
            Loop
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={formData.muted} onChange={e => setFormData({ ...formData, muted: e.target.checked })} />
            Muted
          </label>
        </div>

        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
