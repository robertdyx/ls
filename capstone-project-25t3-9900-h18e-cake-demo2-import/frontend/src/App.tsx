// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import PostEditor from './components/PostEditor';
import { fetchStory } from './lib/fetcher';
import {
  getLatestStory,
  listSections,
  createStory,
  createSection,
  type ID,
} from './lib/db';

/** ==================== 类型与工具 ==================== */
type StoryRow = {
  id: ID;
  title?: string | null;
  standfirst?: string | null;
  version?: string | null;
  theme_font?: string | null;
  theme_primary_color?: string | null;
};

type SectionRow = {
  id: ID;
  story_id: ID;
  type: string;
  sort_order: number;
  data: any;
};

type ImportedJson = {
  title?: string;
  standfirst?: string;
  version?: string | number;
  theme?: { font?: string; primaryColor?: string };
  sections?: any[];
};

type Mode = 'view' | 'edit';
type Device = 'desktop' | 'tablet' | 'iphone' | 'android';

/** 设备外框尺寸（仅前端样式模拟） */
const DEVICE_SIZE: Record<Device, { w: number; scale?: number }> = {
  desktop: { w: 1200 },
  tablet: { w: 820 },
  iphone: { w: 390 },
  android: { w: 412 },
};

/** ==================== 渲染组件 ==================== */
/** 替换后的 Hero：完全按扁平字段渲染 */
const RenderHero: React.FC<{ data: any }> = ({ data }) => {
  const title: string = data?.title ?? '';
  const kicker: string = data?.kicker ?? '';
  const authorLine: string = data?.authorLine ?? '';
  const standfirst: string = data?.standfirst ?? '';

  const alignment: 'left' | 'center' | 'right' =
    (data?.alignment as any) === 'center'
      ? 'center'
      : (data?.alignment as any) === 'right'
      ? 'right'
      : 'left';

  const titleSize: string = data?.titleSize || '36px';
  const standfirstSize: string = data?.standfirstSize || '18px';

  const textColor: string = data?.textColor || '#111827';
  const titleColor: string = data?.titleColor || textColor;
  const standfirstColor: string = data?.standfirstColor || '#4b5563';

  const backgroundColor: string = data?.backgroundColor || '#ffffff';
  const minHeight: string | undefined = data?.height || undefined;

  const sectionStyle: React.CSSProperties = {
    background: backgroundColor,
    color: textColor,
    borderBottom: '1px solid #eee',
    padding: '32px 20px',
    minHeight,
    display: 'flex',
    alignItems: 'center',
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 980,
    margin:
      alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0',
    textAlign: alignment,
  };

  const kickerStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.9,
    marginBottom: 8,
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 800,
    fontSize: titleSize,
    lineHeight: 1.15,
    color: titleColor,
    margin: '0 0 10px',
  };

  const standfirstStyle: React.CSSProperties = {
    fontSize: standfirstSize,
    color: standfirstColor,
    margin: '0 0 10px',
  };

  const authorStyle: React.CSSProperties = {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 6,
  };

  return (
    <section style={sectionStyle}>
      <div style={innerStyle}>
        {kicker && <div style={kickerStyle}>{kicker}</div>}
        {title && <h1 style={titleStyle}>{title}</h1>}
        {standfirst && <p style={standfirstStyle}>{standfirst}</p>}
        {authorLine && <div style={authorStyle}>{authorLine}</div>}
      </div>
    </section>
  );
};

/** —— 段落 HTML 清洗与分段 —— */
function splitHtmlParagraphs(input: string) {
  if (!input) return [];
  const html = input.trim();
  const core = html
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
    .split(/<\/p>\s*<p>/i);
  return core.map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
}

const RenderImage: React.FC<{ data: any; center?: boolean }> = ({ data, center }) => {
  const src = data?.src || data?.url || '';
  const alt = data?.alt || '';
  const caption = data?.caption || '';
  const credit = data?.credit || '';

  const imgStyle: React.CSSProperties = center
    ? { display: 'block', maxWidth: 900, width: '100%', margin: '0 auto', borderRadius: 8 }
    : { display: 'block', maxWidth: '100%', width: '100%', borderRadius: 8 };

  const figureStyle: React.CSSProperties = {
    padding: 20,
    borderBottom: '1px solid #eee',
    ...(center ? { maxWidth: 980, margin: '0 auto' } : null),
  };

  return (
    <figure style={figureStyle}>
      {src ? (
        <img src={src} alt={alt} style={imgStyle} />
      ) : (
        <div style={{ padding: 16, background: '#fafafa', border: '1px dashed #ddd' }}>
          Image URL is empty
        </div>
      )}
      {(caption || credit) && (
        <figcaption
          style={{
            color: '#666',
            marginTop: 8,
            fontSize: 14,
            textAlign: center ? 'center' : 'left',
          }}
        >
          {caption}
          {credit ? <span style={{ color: '#999' }}> · {credit}</span> : null}
        </figcaption>
      )}
    </figure>
  );
};

const RenderParagraph: React.FC<{ data: any }> = ({ data }) => {
  const raw = data?.content ?? data?.text ?? '';
  const paras = raw.includes('<p') ? splitHtmlParagraphs(raw) : String(raw).split(/\n{2,}/);

  return (
    <div style={{ padding: '16px 20px', lineHeight: 1.8, borderBottom: '1px solid #eee' }}>
      {paras.length === 0 ? (
        <p style={{ color: '#6b7280' }}></p>
      ) : (
        paras.map((t, i) => (
          <p key={i} style={{ margin: '0 0 1em' }}>
            {t}
          </p>
        ))
      )}
    </div>
  );
};

const RenderPullQuote: React.FC<{ data: any }> = ({ data }) => {
  const text = data?.text || '';
  const cite = data?.cite || '';
  return (
    <blockquote
      style={{
        borderLeft: '4px solid #444',
        margin: 0,
        padding: '12px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #eee',
      }}
    >
      <div style={{ fontSize: 18, fontStyle: 'italic' }}>{text}</div>
      {cite && <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>— {cite}</div>}
    </blockquote>
  );
};

const RenderVideo: React.FC<{ data: any }> = ({ data }) => {
  const src = data?.src || data?.url || '';
  const poster = data?.poster || '';
  const caption = data?.caption || '';
  return (
    <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
      {src ? (
        <video
          controls
          playsInline
          poster={poster || undefined}
          style={{ width: '100%', borderRadius: 8 }}
          src={src}
        />
      ) : (
        <div style={{ padding: 16, background: '#fafafa', border: '1px dashed #ddd' }}>
          Video URL is empty
        </div>
      )}
      {caption && <div style={{ marginTop: 8, color: '#666' }}>{caption}</div>}
    </div>
  );
};

const RenderUnknown: React.FC<{ data: any; type: string }> = ({ data, type }) => {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Unsupported section: {type}</div>
      <pre
        style={{
          fontSize: 12,
          background: '#f6f8fa',
          padding: 12,
          borderRadius: 8,
          overflowX: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

/** 按类型渲染一条分段 */
const SectionRenderer: React.FC<{ row: SectionRow; centerSingleImage?: boolean }> = ({
  row,
  centerSingleImage,
}) => {
  const t = (row.type || '').toLowerCase();
  if (t === 'hero') return <RenderHero data={row.data} />;
  if (t === 'image') return <RenderImage data={row.data} center={!!centerSingleImage} />;
  if (t === 'paragraph') return <RenderParagraph data={row.data} />;
  if (t === 'pullquote') return <RenderPullQuote data={row.data} />;
  if (t === 'video') return <RenderVideo data={row.data} />;
  if (t === 'imagegroup') {
    const items: any[] = Array.isArray(row.data?.items) ? row.data.items : [];
    return (
      <div>
        {items.map((it, i) => (
          <RenderImage key={i} data={it} />
        ))}
      </div>
    );
  }
  if (t === 'scrollytelling') {
    const steps: any[] = Array.isArray(row.data?.steps) ? row.data.steps : [];
    return (
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
        <RenderHero data={row.data} />
        <div style={{ padding: '8px 20px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ margin: '8px 0', color: '#444' }}>
              {s?.text || s?.title || JSON.stringify(s)}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return <RenderUnknown data={row.data} type={row.type} />;
};

/** 预览容器（套壳模拟设备宽度） */
const DeviceFrame: React.FC<{ device: Device; children: React.ReactNode }> = ({
  device,
  children,
}) => {
  const spec = DEVICE_SIZE[device];
  const w = spec.w;
  const outer: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 0',
    background: '#f3f4f6',
    minHeight: 'calc(100vh - 56px)',
  };
  const inner: React.CSSProperties = {
    width: w,
    maxWidth: '100%',
    background: '#fff',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  };
  return (
    <div style={outer}>
      <div style={inner}>{children}</div>
    </div>
  );
};

/** ==================== 主应用 ==================== */
export default function App() {
  const [mode, setMode] = useState<Mode>('view');
  const [device, setDevice] = useState<Device>('desktop');

  const [story, setStory] = useState<StoryRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /** 统计整篇 image 数量，用于“单图居中” */
  const imageCount = useMemo(
    () => sections.filter(s => (s.type || '').toLowerCase() === 'image').length,
    [sections]
  );

  /** 拉取最新 story + sections */
  const refresh = async () => {
    setLoading(true);
    try {
      const s = await getLatestStory();
      if (!s) {
        setStory(null);
        setSections([]);
      } else {
        setStory(s as any);
        const list = await listSections((s as any).id);
        setSections((list as any[]).sort((a, b) => a.sort_order - b.sort_order));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchStory().catch(() => null);
      } finally {
        await refresh();
      }
    })();
  }, []);

  /** 导入 JSON → 写入 Supabase → 预览 */
  const importStoryToSupabase = async (json: ImportedJson) => {
    const payload = {
      title: json.title ?? 'Untitled story',
      version: json.version ? String(json.version) : 'v1',
      standfirst: json.standfirst ?? '',
      theme_font: json.theme?.font ?? 'Inter',
      theme_primary_color: json.theme?.primaryColor ?? '#0f766e',
    };
    const s = await createStory(payload as any);
    const storyId: ID = (s as any).id;

    const arr = Array.isArray(json.sections) ? json.sections : [];
    for (let i = 0; i < arr.length; i++) {
      const sec = arr[i];
      await createSection(storyId, {
        type: String(sec?.type ?? 'paragraph'),
        sort_order: i,
        data: sec ?? {},
      } as any);
    }
    setMsg(`Imported story #${String(storyId)} with ${arr.length} section(s).`);
    setMode('view');
    await refresh();
  };

  const handleImportBtn = () => fileInputRef.current?.click();
  const handleFilePicked = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text) as ImportedJson;
      setMsg(
        `Loaded JSON: ${json?.title ?? 'Untitled'}${
          json?.version ? ' (' + json.version + ')' : ''
        } — importing…`
      );
      await importStoryToSupabase(json);
    } catch (e: any) {
      setMsg(`Failed to import: ${e?.message ?? String(e)}`);
    } finally {
      ev.target.value = '';
    }
  };

  /** 顶部工具条 */
  const TopBar = (
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 22, fontFamily: 'serif' }}>
        {story ? `Story` : 'News Story Studio'}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button
          onClick={handleImportBtn}
          className="btn"
          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}
        >
          Import data
        </button>

        <button
          onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
          className="btn"
          style={{
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: mode === 'edit' ? '#111827' : '#fff',
            color: mode === 'edit' ? '#fff' : '#111',
          }}
        >
          {mode === 'edit' ? 'Exit Edit' : 'Edit'}
        </button>

        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: 2,
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#f9fafb',
          }}
        >
          {(['desktop', 'tablet', 'iphone', 'android'] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: device === d ? '#4f46e5' : '#fff',
                color: device === d ? '#fff' : '#111',
              }}
              title={`Preview: ${d}`}
            >
              {d === 'desktop' && 'Desktop'}
              {d === 'tablet' && 'Tablet'}
              {d === 'iphone' && 'iPhone'}
              {d === 'android' && 'Android'}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFilePicked}
        />
      </div>
    </div>
  );

  /** 预览主体 */
  const Preview = (
    <DeviceFrame device={device}>
      <article style={{ padding: 16 }}>
        {story && (
          <header style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Editing Story #{String(story.id)} {story.version ? `· ${story.version}` : ''}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '6px 0' }}>
              {story.title || 'Untitled'}
            </h1>
            {story.standfirst && <p style={{ color: '#6b7280' }}>{story.standfirst}</p>}
          </header>
        )}
        <section>
          {sections.map((row) => (
            <SectionRenderer
              key={row.id}
              row={row}
              centerSingleImage={imageCount === 1}
            />
          ))}
          {!sections.length && (
            <div style={{ padding: 20, color: '#6b7280' }}>No sections yet.</div>
          )}
        </section>
      </article>
    </DeviceFrame>
  );

  /** 页面布局：view=单栏预览；edit=左预览右编辑 */
  const Layout = useMemo(() => {
    if (mode === 'edit') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(380px, 520px)' }}>
          <div>{Preview}</div>
          <div
            style={{
              minHeight: 'calc(100vh - 56px)',
              borderLeft: '1px solid #e5e7eb',
              background: '#fff',
              overflow: 'auto',
            }}
          >
            <PostEditor />
          </div>
        </div>
      );
    }
    return Preview;
  }, [mode, device, story, sections, imageCount]);

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      {TopBar}
      {msg && (
        <div
          style={{
            background: '#ecfeff',
            color: '#155e75',
            padding: '8px 12px',
            borderBottom: '1px solid #bae6fd',
          }}
        >
          {msg}
        </div>
      )}
      {loading ? <div style={{ padding: 24 }}>Loading…</div> : <div>{Layout}</div>}
    </main>
  );
}
