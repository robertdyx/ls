import React, { useState } from 'react';

export type ImageGroupItem = { src: string; alt?: string; caption?: string; credit?: string };
export type ImageGroupData = { type?: 'imagegroup'; items: ImageGroupItem[] };

type Props = {
  value: ImageGroupData;
  onChange: (next: ImageGroupData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>;
};

export default function ImageGroupEditForm({ value, onChange, onUpload }: Props) {
  const [local, setLocal] = useState<ImageGroupData>(value ?? { type: 'imagegroup', items: [] });

  const merge = (patch: Partial<ImageGroupData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const addItem = async (file?: File) => {
    let url = '';
    if (file) url = await onUpload(file);
    merge({ items: [...(local.items ?? []), { src: url }] });
  };

  return (
    <div className="space-y-3">
      {(local.items ?? []).map((it, i) => (
        <div key={i} className="grid gap-2 border rounded p-2">
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 flex-1"
              value={it.src}
              onChange={e => {
                const arr = [...(local.items ?? [])];
                arr[i] = { ...arr[i], src: e.target.value };
                merge({ items: arr });
              }}
              placeholder="https://…"
            />
            <input
              type="file"
              onChange={async e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await onUpload(f);
                const arr = [...(local.items ?? [])];
                arr[i] = { ...arr[i], src: url };
                merge({ items: arr });
              }}
            />
          </div>
          <input
            className="border rounded px-2 py-1"
            placeholder="Alt"
            value={it.alt ?? ''}
            onChange={e => {
              const arr = [...(local.items ?? [])];
              arr[i] = { ...arr[i], alt: e.target.value };
              merge({ items: arr });
            }}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Caption"
            value={it.caption ?? ''}
            onChange={e => {
              const arr = [...(local.items ?? [])];
              arr[i] = { ...arr[i], caption: e.target.value };
              merge({ items: arr });
            }}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Credit"
            value={it.credit ?? ''}
            onChange={e => {
              const arr = [...(local.items ?? [])];
              arr[i] = { ...arr[i], credit: e.target.value };
              merge({ items: arr });
            }}
          />
          <div className="flex justify-end">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                const arr = [...(local.items ?? [])];
                arr.splice(i, 1);
                merge({ items: arr });
              }}
            >
              删除该图片
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded" onClick={() => addItem()}>
          + 添加空项
        </button>
        <input type="file" onChange={e => {
          const f = e.target.files?.[0]; if (f) addItem(f);
        }} />
      </div>
    </div>
  );
}
