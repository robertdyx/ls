import React, { useState } from 'react';

export type ImageData = {
  type?: 'image';
  src?: string;
  alt?: string;
  caption?: string;
  credit?: string;
};

type Props = {
  value: ImageData;
  onChange: (next: ImageData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>;
};

export default function ImageEditForm({ value, onChange, onUpload }: Props) {
  const [local, setLocal] = useState<ImageData>(value ?? { type: 'image' });

  const merge = (patch: Partial<ImageData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await onUpload(f);
    merge({ src: url });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label className="text-sm">Image URL</label>
        <input
          className="border rounded px-2 py-1"
          value={local.src ?? ''}
          onChange={e => merge({ src: e.target.value })}
          placeholder="https://…"
        />
        <input type="file" onChange={handleFile} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Alt text</label>
        <input
          className="border rounded px-2 py-1"
          value={local.alt ?? ''}
          onChange={e => merge({ alt: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Caption</label>
        <input
          className="border rounded px-2 py-1"
          value={local.caption ?? ''}
          onChange={e => merge({ caption: e.target.value })}
        />
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
