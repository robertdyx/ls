// src/components/PostEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase } from '../lib/fetcher';

/* =========================================================
   通用：API 基址与请求工具（带 ngrok 绕过头）
   ========================================================= */
const API_BASE_URL = getApiBase();

const NGROK_GET_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
} as const;

const NGROK_JSON_HEADERS = {
  ...NGROK_GET_HEADERS,
  'Content-Type': 'application/json',
} as const;

async function fetchAsJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    headers: { ...NGROK_GET_HEADERS, ...(init?.headers || {}) },
    ...init,
  });
  const ctype = res.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const brief =
      typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200);
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
  }
  return payload;
}

async function sendJson(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: any) {
  const res = await fetch(url, {
    method,
    mode: 'cors',
    credentials: 'omit',
    headers: NGROK_JSON_HEADERS,
    body:
      body == null
        ? undefined
        : typeof body === 'string'
        ? body
        : JSON.stringify(body),
  });
  const ctype = res.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const brief =
      typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200);
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
  }
  return payload;
}

/* =========================================================
   类型与工具
   ========================================================= */
type SectionType =
  | 'hero'
  | 'paragraph'
  | 'image'
  | 'imagegroup'
  | 'pullquote'
  | 'scrollytelling'
  | string;

interface Section {
  id: number;
  story_id: number;
  type: SectionType;
  /** 后端表里多为 content(Text)。为兼容旧数据，下面渲染时仍从 JSON 内部取具体字段 */
  content: string; // 保存时是 JSON 字符串
  sort_order: number;
}

interface Story {
  id: number;
  title?: string;
  [k: string]: any;
}

/* =========================================================
   子表单（略）—— 和你当前版本一致
   ========================================================= */
// ---------- Hero ----------
type HeroData = {
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  kicker?: string;
  authorLine?: string;
};
function HeroEditForm({ value, onChange }: { value: HeroData; onChange: (v: HeroData) => void }) {
  return (
    <div className="form-grid">
      <label>
        Title
        <input
          value={value.title || ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Hero title"
        />
      </label>
      <label>
        Kicker
        <input
          value={value.kicker || ''}
          onChange={(e) => onChange({ ...value, kicker: e.target.value })}
          placeholder="Byline / kicker"
        />
      </label>
      <label>
        Author Line
        <input
          value={value.authorLine || ''}
          onChange={(e) => onChange({ ...value, authorLine: e.target.value })}
          placeholder="Author(s)"
        />
      </label>
      <label>
        Background Color
        <input
          value={value.backgroundColor || ''}
          onChange={(e) => onChange({ ...value, backgroundColor: e.target.value })}
          placeholder="#0d3557"
        />
      </label>
      <label>
        Text Color
        <input
          value={value.textColor || ''}
          onChange={(e) => onChange({ ...value, textColor: e.target.value })}
          placeholder="#ffffff"
        />
      </label>
    </div>
  );
}

// ---------- Paragraph ----------
type ParagraphData = { content?: string };
function ParagraphEditForm({
  value,
  onChange,
}: {
  value: ParagraphData;
  onChange: (v: ParagraphData) => void;
}) {
  return (
    <label className="block">
      Content
      <textarea
        rows={5}
        value={value.content || ''}
        onChange={(e) => onChange({ ...value, content: e.target.value })}
        placeholder="Paragraph text..."
      />
    </label>
  );
}

// ---------- Image ----------
type ImageData = {
  src?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  layout?: 'default' | 'third' | 'inline';
};
function ImageEditForm({ value, onChange }: { value: ImageData; onChange: (v: ImageData) => void }) {
  return (
    <div className="form-grid">
      <label>
        Image URL
        <input
          value={value.src || ''}
          onChange={(e) => onChange({ ...value, src: e.target.value })}
          placeholder="https://..."
        />
      </label>
      <label>
        Alt
        <input
          value={value.alt || ''}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Alternative text"
        />
      </label>
      <label>
        Caption
        <input
          value={value.caption || ''}
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
          placeholder="Caption"
        />
      </label>
      <label>
        Credit
        <input
          value={value.credit || ''}
          onChange={(e) => onChange({ ...value, credit: e.target.value })}
          placeholder="Photo credit"
        />
      </label>
      <label>
        Layout
        <select
          value={value.layout || 'default'}
          onChange={(e) => onChange({ ...value, layout: e.target.value as ImageData['layout'] })}
        >
          <option value="default">default</option>
          <option value="third">third</option>
          <option value="inline">inline</option>
        </select>
      </label>
    </div>
  );
}

// ---------- ImageGroup ----------
type ImageGroupItem = { src?: string; alt?: string; caption?: string; credit?: string };
type ImageGroupData = { images?: ImageGroupItem[] };
function ImageGroupEditForm({
  value,
  onChange,
}: {
  value: ImageGroupData;
  onChange: (v: ImageGroupData) => void;
}) {
  const images = value.images || [];
  const updateAt = (idx: number, patch: Partial<ImageGroupItem>) => {
    const next = images.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ images: next });
  };
  return (
    <div className="stack">
      {images.map((img, i) => (
        <div key={i} className="card">
          <div className="form-grid">
            <label>
              Image URL
              <input
                value={img.src || ''}
                onChange={(e) => updateAt(i, { src: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <label>
              Alt
              <input
                value={img.alt || ''}
                onChange={(e) => updateAt(i, { alt: e.target.value })}
                placeholder="Alt"
              />
            </label>
            <label>
              Caption
              <input
                value={img.caption || ''}
                onChange={(e) => updateAt(i, { caption: e.target.value })}
                placeholder="Caption"
              />
            </label>
            <label>
              Credit
              <input
                value={img.credit || ''}
                onChange={(e) => updateAt(i, { credit: e.target.value })}
                placeholder="Credit"
              />
            </label>
          </div>
          <div className="row">
            <button type="button" className="danger" onClick={() => onChange({ images: images.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ images: [...images, { src: '', alt: '' }] })}>
        + Add Image
      </button>
    </div>
  );
}

// ---------- PullQuote ----------
type PullQuoteData = { text?: string; attribution?: string };
function PullQuoteEditForm({
  value,
  onChange,
}: {
  value: PullQuoteData;
  onChange: (v: PullQuoteData) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        Text
        <input
          value={value.text || ''}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Quote content"
        />
      </label>
      <label>
        Attribution
        <input
          value={value.attribution || ''}
          onChange={(e) => onChange({ ...value, attribution: e.target.value })}
          placeholder="— Name"
        />
      </label>
    </div>
  );
}

// ---------- Scrollytelling ----------
type ScrollytellingData = Record<string, any>;
function ScrollytellingEditForm({
  value,
  onChange,
}: {
  value: ScrollytellingData;
  onChange: (v: ScrollytellingData) => void;
}) {
  const [raw, setRaw] = useState<string>(JSON.stringify(value || {}, null, 2));
  useEffect(() => {
    setRaw(JSON.stringify(value || {}, null, 2));
  }, [value]);
  return (
    <label className="block">
      JSON
      <textarea
        rows={12}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          try {
            onChange(JSON.parse(raw || '{}'));
          } catch {
            alert('Invalid JSON in scrollytelling editor. Please fix it.');
          }
        }}
        placeholder={`{\n  "items": [ ... ]\n}`}
      />
    </label>
  );
}

/* =========================================================
   Section 表单容器
   ========================================================= */
function SectionTypeForm({
  type,
  valueJson,
  sortOrder,
  onTypeChange,
  onDataChange,
  onSortChange,
}: {
  type: SectionType;
  valueJson: string;
  sortOrder: number;
  onTypeChange: (t: SectionType) => void;
  onDataChange: (json: string) => void;
  onSortChange: (n: number) => void;
}) {
  const dataObj = useMemo(() => {
    try {
      return valueJson ? JSON.parse(valueJson) : {};
    } catch {
      return {};
    }
  }, [valueJson]);

  const setDataObj = (obj: any) => onDataChange(JSON.stringify(obj ?? {}, null, 2));

  return (
    <div className="stack">
      <div className="form-grid">
        <label>
          Type
          <select value={type} onChange={(e) => onTypeChange(e.target.value)}>
            <option value="hero">hero</option>
            <option value="paragraph">paragraph</option>
            <option value="image">image</option>
            <option value="imagegroup">imagegroup</option>
            <option value="pullquote">pullquote</option>
            <option value="scrollytelling">scrollytelling</option>
          </select>
        </label>
        <label>
          Sort Order
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => onSortChange(Number(e.target.value))}
            min={0}
            step={1}
          />
        </label>
      </div>

      {type === 'hero' && <HeroEditForm value={dataObj as HeroData} onChange={setDataObj} />}
      {type === 'paragraph' && (
        <ParagraphEditForm value={dataObj as ParagraphData} onChange={setDataObj} />
      )}
      {type === 'image' && <ImageEditForm value={dataObj as ImageData} onChange={setDataObj} />}
      {type === 'imagegroup' && (
        <ImageGroupEditForm value={dataObj as ImageGroupData} onChange={setDataObj} />
      )}
      {type === 'pullquote' && (
        <PullQuoteEditForm value={dataObj as PullQuoteData} onChange={setDataObj} />
      )}
      {type === 'scrollytelling' && (
        <ScrollytellingEditForm value={dataObj as ScrollytellingData} onChange={setDataObj} />
      )}

      <details>
        <summary>Raw JSON (readonly preview)</summary>
        <pre className="json-preview">{valueJson || '{}'}</pre>
      </details>
    </div>
  );
}

/* =========================================================
   Create / Edit 表单
   ========================================================= */
function CreateSectionForm({
  storyId,
  onSuccess,
  onCancel,
}: {
  storyId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<SectionType>('paragraph');
  const [data, setData] = useState<string>('{}');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      JSON.parse(data || '{}'); // 校验 JSON
      // 兼容后端：同时给 content 与 data；后端任选其一即可
      await sendJson(`${API_BASE_URL}/sections`, 'POST', {
        story_id: storyId,
        type,
        content: data,
        data,
        sort_order: sortOrder,
      });
      onSuccess();
    } catch (err) {
      alert(`Create failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h3>Create Section</h3>
      <SectionTypeForm
        type={type}
        valueJson={data}
        sortOrder={sortOrder}
        onTypeChange={setType}
        onDataChange={setData}
        onSortChange={setSortOrder}
      />
      <div className="row">
        <button disabled={busy} onClick={submit}>
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditSectionForm({
  section,
  onSaved,
  onCancel,
}: {
  section: Section;
  onSaved: (next: Section) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<SectionType>(section.type);
  const [data, setData] = useState<string>(section.content || '{}');
  const [sortOrder, setSortOrder] = useState<number>(section.sort_order || 0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      JSON.parse(data || '{}');
      const payload = await sendJson(`${API_BASE_URL}/sections/${section.id}`, 'PATCH', {
        type,
        content: data,
        data, // 兼容字段
        sort_order: sortOrder,
      });
      onSaved(payload);
    } catch (err) {
      alert(`Save failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h3>Edit Section #{section.id}</h3>
      <SectionTypeForm
        type={type}
        valueJson={data}
        sortOrder={sortOrder}
        onTypeChange={setType}
        onDataChange={setData}
        onSortChange={setSortOrder}
      />
      <div className="row">
        <button disabled={busy} onClick={submit}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   主组件：PostEditor
   ========================================================= */
export default function PostEditor({
  embedded = false,
  onClose,
  onSectionsUpdated,
}: {
  embedded?: boolean;
  onClose?: () => void;
  onSectionsUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);

  const refresh = async (skipSpinner = false) => {
    try {
      if (!skipSpinner) setLoading(true);
      const s: Story = await fetchAsJson(`${API_BASE_URL}/story`);
      setStory(s);
      const list: Section[] = await fetchAsJson(`${API_BASE_URL}/sections?story_id=${s.id}`);
      setSections(list);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setSections([]);
    } finally {
      if (!skipSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete section #${id}?`)) return;
    try {
      await sendJson(`${API_BASE_URL}/sections/${id}`, 'DELETE');
      setSections((prev) => prev.filter((s) => s.id !== id));
      onSectionsUpdated?.();
    } catch (err) {
      alert('Delete failed: ' + (err as Error).message);
    }
  };

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [sections]
  );

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>SECTION MANAGEMENT</h2>
        <div className="editor-actions">
          <button onClick={() => setShowCreate((v) => !v)} disabled={!story}>
            {showCreate ? 'Cancel' : '＋'}
          </button>
          <button onClick={() => refresh()} disabled={!story}>
            ⟳
          </button>
        </div>
      </div>

      {error && <div className="error-message">Failed to fetch<br />{error}</div>}

      {!error && (!sections || sections.length === 0) && (
        <div className="muted">No sections yet</div>
      )}

      {showCreate && story && (
        <CreateSectionForm
          storyId={story.id}
          onSuccess={async () => {
            setShowCreate(false);
            await refresh(true);
            onSectionsUpdated?.();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <EditSectionForm
          section={editing}
          onSaved={async (next) => {
            setEditing(null);
            setSections((prev) => prev.map((s) => (s.id === next.id ? next : s)));
            onSectionsUpdated?.();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <ul className="section-list">
        {sortedSections.map((s) => {
          let summary = '';
          try {
            const obj = s.content ? JSON.parse(s.content) : {};
            if (s.type === 'paragraph') summary = (obj.content || '').slice(0, 60);
            if (s.type === 'hero') summary = obj.title || '';
            if (s.type === 'image') summary = obj.src || '';
            if (s.type === 'pullquote') summary = obj.text || '';
            if (s.type === 'imagegroup') summary = `${(obj.images || []).length} images`;
            if (s.type === 'scrollytelling') summary = 'scrollytelling';
          } catch {
            summary = '[invalid json]';
          }
          return (
            <li key={s.id} className="section-item">
              <div className="section-meta">
                <div className="badge">#{s.id}</div>
                <div className="type">{s.type}</div>
                <div className="order">order: {s.sort_order}</div>
              </div>
              <div className="summary">{summary}</div>
              <div className="row">
                <button onClick={() => setEditing(s)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(s.id)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {!embedded && <div className="footer-space" />}
    </div>
  );
}

/* =========================================================
   轻量样式（保留）
   ========================================================= */
const css = `
.editor-container{max-width:980px;margin:0 auto;padding:16px}
.editor-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.editor-actions button{margin-left:8px}
.loading{padding:32px 0;color:#666}
.error-message{color:#b00020;background:#ffecec;padding:12px;border-radius:8px;margin:8px 0;white-space:pre-wrap}
.muted{color:#888;margin:8px 0}
.panel{border:1px solid #e7e7e7;border-radius:12px;padding:12px;margin:12px 0}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.form-grid label{display:flex;flex-direction:column;font-size:14px}
.form-grid input,.form-grid select,.block textarea,.form-grid textarea{margin-top:6px;padding:8px;border:1px solid #ddd;border-radius:8px}
.block{display:block;margin:8px 0}
.stack{display:grid;gap:12px}
.row{display:flex;gap:8px;align-items:center;margin-top:8px}
button{padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer}
button:hover{background:#f6f6f6}
button.secondary{color:#444}
button.danger{color:#b00020;border-color:#f3c2c2}
.card{border:1px solid #eee;border-radius:8px;padding:8px}
.section-list{display:grid;gap:10px;margin-top:12px}
.section-item{border:1px solid #eee;border-radius:12px;padding:10px}
.section-meta{display:flex;gap:10px;align-items:center;margin-bottom:6px}
.badge{background:#f2f3f5;border-radius:999px;padding:0 8px}
.type{font-weight:600}
.json-preview{background:#0b1020;color:#cad3ff;border-radius:8px;padding:8px;overflow:auto}
.footer-space{height:32px}
`;
if (typeof document !== 'undefined' && !document.getElementById('pe-lite-style')) {
  const el = document.createElement('style');
  el.id = 'pe-lite-style';
  el.textContent = css;
  document.head.appendChild(el);
}
