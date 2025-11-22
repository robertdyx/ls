import React, { useEffect, useMemo, useState } from 'react';
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  getLatestStory,
  createStory,
  updateStory,
  type ID,
} from '../lib/db';
import { uploadFile } from '../lib/upload';

// 这些子编辑表单与原项目同名组件；如果你路径不同请调整 import
import HeroEditForm from './forms/HeroEditForm';
import ImageEditForm from './forms/ImageEditForm';
import ScrollytellingEditForm from './forms/ScrollytellingEditForm';
import ImageGroupEditForm from './forms/ImageGroupEditForm';
import ParagraphEditForm from './forms/ParagraphEditForm';
import PullQuoteEditForm from './forms/PullQuoteEditForm';

type SectionRow = {
  id: ID;
  story_id: ID;
  type: string;
  sort_order: number;
  data: any;
};

type StoryRow = {
  id: ID;
  title?: string | null;
  version?: string | null;
  standfirst?: string | null;
  theme_font?: string | null;
  theme_primary_color?: string | null;
};

const SECTION_TYPE_TO_LABEL: Record<string, string> = {
  hero: 'Hero',
  image: 'Image',
  scrollytelling: 'Scrollytelling',
  imagegroup: 'Image Group',
  paragraph: 'Paragraph',
  pullquote: 'Pull Quote',
};

const NEW_SECTION_TEMPLATES: Record<string, any> = {
  hero: { type: 'hero', title: '', subtitle: '', src: '', poster: '', credit: '' },
  image: { type: 'image', src: '', alt: '', caption: '', credit: '' },
  scrollytelling: { type: 'scrollytelling', steps: [], backgroundVideo: '', backgroundImages: [] },
  imagegroup: { type: 'imagegroup', items: [] },
  paragraph: { type: 'paragraph', text: '' },
  pullquote: { type: 'pullquote', text: '', cite: '' },
};

export default function PostEditor() {
  const [story, setStory] = useState<StoryRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextSort = useMemo(
    () => (sections.length ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0),
    [sections]
  );

  /** ---------------- 初始化：拿“最新 story ”并加载 sections ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let s = await getLatestStory();
        if (!s) {
          // 数据库为空时，自动建一个空 story，维持原有“默认一篇可编辑”的体验
          s = await createStory({
            title: 'Untitled story',
            version: 'v1',
            theme_font: 'Inter',
            theme_primary_color: '#0f766e',
          });
        }
        setStory(s);
        const rows = await listSections(s.id);
        setSections(rows as any);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** ---------------- 上传：统一用 Supabase Storage ---------------- */
  const handleUpload = async (file: File): Promise<string> => {
    const { publicUrl } = await uploadFile(file, 'uploads');
    return publicUrl;
  };

  /** ---------------- 新建分段 ---------------- */
  const handleCreate = async (type: string) => {
    if (!story) return;
    setCreating(true);
    try {
      const payload = NEW_SECTION_TEMPLATES[type] ?? { type };
      const created = await createSection(story.id, {
        type,
        sort_order: nextSort,
        data: payload,
      });
      setSections(prev => [...prev, created as any].sort((a, b) => a.sort_order - b.sort_order));
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setCreating(false);
    }
  };

  /** ---------------- 更新分段 ---------------- */
  const handleUpdate = async (row: SectionRow, patch: Partial<SectionRow>) => {
    const updated = await updateSection(row.id, patch);
    setSections(prev => prev.map(s => (s.id === row.id ? (updated as any) : s)));
  };

  /** ---------------- 删除分段 ---------------- */
  const handleDelete = async (row: SectionRow) => {
    await deleteSection(row.id);
    setSections(prev => prev.filter(s => s.id !== row.id));
  };

  /** ---------------- Story 主题更新（可选） ---------------- */
  const saveTheme = async (patch: Partial<StoryRow>) => {
    if (!story) return;
    const updated = await updateStory(story.id, patch);
    setStory(updated as any);
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!story) return <div className="p-4">No story</div>;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-xl font-semibold">
          Editing Story #{story.id} — {story.title ?? 'Untitled'}
        </div>
        <div className="flex gap-2">
          {/* 你原有的主题编辑 UI 可以继续使用；下面仅示例 */}
          <button
            className="px-3 py-1 rounded bg-emerald-600 text-white"
            onClick={() => saveTheme({ theme_primary_color: '#0f766e' })}
          >
            Use Teal
          </button>
        </div>
      </header>

      {/* 新建分段按钮 */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(SECTION_TYPE_TO_LABEL).map(t => (
          <button
            key={t}
            disabled={creating}
            onClick={() => handleCreate(t)}
            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
          >
            + {SECTION_TYPE_TO_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 分段列表 */}
      <ol className="space-y-6">
        {sections.map((row, idx) => (
          <li key={row.id} className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                #{row.id} · order {row.sort_order} · <b>{row.type}</b>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() =>
                    handleUpdate(row, { sort_order: Math.max(0, row.sort_order - 1) })
                  }
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => handleUpdate(row, { sort_order: row.sort_order + 1 })}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="px-3 py-1 rounded border text-red-600"
                  onClick={() => handleDelete(row)}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* 根据 type 渲染对应的编辑表单；各表单内部已改为使用 uploadFile */}
            {row.type === 'hero' && (
              <HeroEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
            {row.type === 'image' && (
              <ImageEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
            {row.type === 'scrollytelling' && (
              <ScrollytellingEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
            {row.type === 'imagegroup' && (
              <ImageGroupEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
            {row.type === 'paragraph' && (
              <ParagraphEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
            {row.type === 'pullquote' && (
              <PullQuoteEditForm
                value={row.data}
                onUpload={handleUpload}
                onChange={async (next) => handleUpdate(row, { data: next })}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
