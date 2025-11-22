// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import PostEditor from './components/PostEditor';
import { fetchStory } from './lib/fetcher';
import './App.css';

type PreviewStory = {
  id?: number;
  title?: string;
  standfirst?: string;
  version?: string;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState<PreviewStory | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 首页尝试拉取一次 story 作为预览；失败则自动进入编辑器（前端直连 Supabase）
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const story = await fetchStory(); // 成功则保留欢迎页与“开始编辑”
        if (!mounted) return;
        setPreview({
          id: (story as any).id,
          title: (story as any).title,
          standfirst: (story as any).standfirst,
          version: (story as any).version,
        });
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        // 关键逻辑：一旦出错，直接进入编辑器；不再阻塞在“后端不可达”的提示页
        setError(e?.message ?? String(e));
        setShowEditor(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 触发本地导入（仅做解析预览；真正入库可后续接 db.ts 的写入）
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFilePicked = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setImportInfo(
        `Loaded JSON: ${json?.title ?? 'Untitled'}${json?.version ? ' (' + json.version + ')' : ''}`
      );
    } catch (e: any) {
      setImportInfo(`Failed to parse JSON: ${e?.message ?? String(e)}`);
    } finally {
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

  // 一旦 showEditor=true（比如预览失败/或用户点击“Start Editing”），直接进入前端直连 Supabase 的编辑器
  if (showEditor) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <PostEditor />
      </main>
    );
  }

  // —— 保留原 UI（欢迎页 + 按钮），但不再显示“需要后端”的报错 —— //
  return (
    <main className="mx-auto max-w-4xl p-8">
      {/* 顶部提示（仅信息，不阻塞） */}
      {error && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Note: preview failed ({error}). You can still edit directly — click “Start Editing”.
        </div>
      )}

      <section className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-serif font-bold">News Story Studio</h1>
        <p className="text-gray-600">
          Frontend connects to Supabase directly. You can import a JSON for preview or start editing
          now.
        </p>
      </section>

      {/* 预览卡片（如果有） */}
      {preview && (
        <div className="mb-6 rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">
            Latest Story{preview.id ? ` #${preview.id}` : ''}{' '}
            {preview.version ? `· ${preview.version}` : ''}
          </div>
          <div className="font-semibold">{preview.title ?? 'Untitled'}</div>
          {preview.standfirst && (
            <div className="mt-1 text-gray-600">{preview.standfirst}</div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
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
