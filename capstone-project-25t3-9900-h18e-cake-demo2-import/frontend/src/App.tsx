// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import PostEditor from './components/PostEditor';
import { fetchStory } from './lib/fetcher';
import {
  createStory,
  createSection,
  type ID,
} from './lib/db';
import './App.css';

type PreviewStory = {
  id?: number;
  title?: string;
  standfirst?: string;
  version?: string;
};

type ImportedJson = {
  title?: string;
  standfirst?: string;
  version?: string | number;
  theme?: { font?: string; primaryColor?: string };
  sections?: any[];
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState<PreviewStory | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 首页尽量拿一次预览；失败也不阻塞，直接可进入编辑器
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const s = await fetchStory();
        if (!mounted) return;
        setPreview({
          id: (s as any).id,
          title: (s as any).title,
          standfirst: (s as any).standfirst,
          version: (s as any).version,
        });
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? String(e));
        // 仅提示，不强制立刻跳编辑器；用户可手动点“Start Editing”
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 点击导入按钮
  const handleImportClick = () => fileInputRef.current?.click();

  // 将 JSON 写入 Supabase：新建 story + 批量插入 sections
  const importStoryToSupabase = async (json: ImportedJson) => {
    const storyPayload = {
      title: json.title ?? 'Untitled story',
      version: json.version ? String(json.version) : 'v1',
      standfirst: json.standfirst ?? '',
      theme_font: json.theme?.font ?? 'Inter',
      theme_primary_color: json.theme?.primaryColor ?? '#0f766e',
    };

    // 1) 新建 story
    const story = await createStory(storyPayload as any);
    const storyId: ID = (story as any).id;

    // 2) 批量写 sections（保持数组顺序为 sort_order）
    const sections = Array.isArray(json.sections) ? json.sections : [];
    let inserted = 0;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const type = (sec && sec.type) ? String(sec.type) : 'paragraph';
      // data 原样保存，保持导入后的编辑灵活性
      await createSection(storyId, {
        type,
        sort_order: i,
        data: sec ?? {},
      } as any);
      inserted++;
    }

    setImportInfo(
      `Imported: story #${String(storyId)} with ${inserted} section(s).`
    );

    // 3) 进入编辑器
    setShowEditor(true);
  };

  // 选择文件并导入
  const handleFilePicked = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as ImportedJson;
      // 先给用户一个解析成功的提示
      setImportInfo(
        `Loaded JSON: ${json?.title ?? 'Untitled'}${
          json?.version ? ' (' + json.version + ')' : ''
        } — importing to Supabase…`
      );
      await importStoryToSupabase(json);
    } catch (e: any) {
      setImportInfo(`Failed to import JSON: ${e?.message ?? String(e)}`);
    } finally {
      // 允许再次选择同一个文件
      ev.target.value = '';
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-8 text-center">
        <div className="text-lg">Loading…</div>
      </main>
    );
  }

  if (showEditor) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <PostEditor />
      </main>
    );
  }

  // 欢迎页 UI（保留）
  return (
    <main className="mx-auto max-w-4xl p-8">
      {error && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Note: preview failed ({error}). You can still edit directly — click “Start Editing”.
        </div>
      )}

      <section className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-serif font-bold">News Story Studio</h1>
        <p className="text-gray-600">
          Frontend connects to Supabase directly. You can import a JSON for preview or start editing now.
        </p>
      </section>

      {preview && (
        <div className="mb-6 rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">
            Latest Story{preview.id ? ` #${preview.id}` : ''}{' '}
            {preview.version ? `· ${preview.version}` : ''}
          </div>
          <div className="font-semibold">{preview.title ?? 'Untitled'}</div>
          {preview.standfirst && <div className="mt-1 text-gray-600">{preview.standfirst}</div>}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <button
          onClick={handleImportClick}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:opacity-90"
        >
          Import Data
        </button>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 rounded bg-violet-700 text-white hover:opacity-90"
        >
          Start Editing
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFilePicked}
        />
      </div>

      {importInfo && <div className="mt-4 text-sm text-gray-700">{importInfo}</div>}
    </main>
  );
}
