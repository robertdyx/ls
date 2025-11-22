import React, { useState } from 'react';

export type HeroData = {
  type?: 'hero';
  title?: string;
  subtitle?: string;
  src?: string;      // 背景视频/图片
  poster?: string;   // 视频封面
  credit?: string;
};

type Props = {
  value: HeroData;
  onChange: (next: HeroData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>;
};

export default function HeroEditForm({ value, onChange, onUpload }: Props) {
  const [local, setLocal] = useState<HeroData>(value ?? { type: 'hero' });

  const merge = (patch: Partial<HeroData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, key: 'src' | 'poster') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUpload(file);
    merge({ [key]: url } as any);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label className="text-sm">Title</label>
        <input
          className="border rounded px-2 py-1"
          value={local.title ?? ''}
          onChange={e => merge({ title: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Subtitle</label>
        <input
          className="border rounded px-2 py-1"
          value={local.subtitle ?? ''}
          onChange={e => merge({ subtitle: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Background Video/Image URL</label>
        <input
          className="border rounded px-2 py-1"
          value={local.src ?? ''}
          onChange={e => merge({ src: e.target.value })}
          placeholder="https://…"
        />
        <input type="file" onChange={e => handleFile(e, 'src')} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Poster (for video)</label>
        <input
          className="border rounded px-2 py-1"
          value={local.poster ?? ''}
          onChange={e => merge({ poster: e.target.value })}
          placeholder="https://…"
        />
        <input type="file" onChange={e => handleFile(e, 'poster')} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Credit</label>
        <input
          className="border rounded px-2 py-1"
          value={local.credit ?? ''}
          onChange={e => merge({ credit: e.target.value })}
        />
      </div>
    </div>
  );
}
