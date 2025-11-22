import React, { useState } from 'react';

export type ScrollyStep = { heading?: string; text?: string };
export type ScrollytellingData = {
  type?: 'scrollytelling';
  steps: ScrollyStep[];
  backgroundVideo?: string;
  backgroundImages?: string[];
};

type Props = {
  value: ScrollytellingData;
  onChange: (next: ScrollytellingData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>;
};

export default function ScrollytellingEditForm({ value, onChange, onUpload }: Props) {
  const [local, setLocal] = useState<ScrollytellingData>(
    value ?? { type: 'scrollytelling', steps: [], backgroundImages: [] }
  );

  const merge = (patch: Partial<ScrollytellingData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const uploadAs = async (file: File, key: 'backgroundVideo' | 'backgroundImages') => {
    const url = await onUpload(file);
    if (key === 'backgroundVideo') merge({ backgroundVideo: url });
    else merge({ backgroundImages: [...(local.backgroundImages ?? []), url] });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm">Background video URL</label>
        <input
          className="border rounded px-2 py-1"
          value={local.backgroundVideo ?? ''}
          onChange={e => merge({ backgroundVideo: e.target.value })}
          placeholder="https://…"
        />
        <input type="file" onChange={e => {
          const f = e.target.files?.[0]; if (f) uploadAs(f, 'backgroundVideo');
        }} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm">Background images</label>
        <div className="flex flex-col gap-2">
          {(local.backgroundImages ?? []).map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 flex-1"
                value={u}
                onChange={e => {
                  const arr = [...(local.backgroundImages ?? [])];
                  arr[i] = e.target.value;
                  merge({ backgroundImages: arr });
                }}
              />
              <button
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const arr = [...(local.backgroundImages ?? [])];
                  arr.splice(i, 1);
                  merge({ backgroundImages: arr });
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <input type="file" onChange={e => {
          const f = e.target.files?.[0]; if (f) uploadAs(f, 'backgroundImages');
        }} />
      </div>

      <div className="space-y-2">
        <div className="font-medium">Steps</div>
        {(local.steps ?? []).map((st, i) => (
          <div key={i} className="grid gap-2 border rounded p-2">
            <input
              className="border rounded px-2 py-1"
              placeholder="Heading"
              value={st.heading ?? ''}
              onChange={e => {
                const steps = [...(local.steps ?? [])];
                steps[i] = { ...steps[i], heading: e.target.value };
                merge({ steps });
              }}
            />
            <textarea
              className="border rounded px-2 py-1"
              placeholder="Text"
              value={st.text ?? ''}
              onChange={e => {
                const steps = [...(local.steps ?? [])];
                steps[i] = { ...steps[i], text: e.target.value };
                merge({ steps });
              }}
            />
            <div className="flex justify-end">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const steps = [...(local.steps ?? [])];
                  steps.splice(i, 1);
                  merge({ steps });
                }}
              >
                删除该步骤
              </button>
            </div>
          </div>
        ))}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => merge({ steps: [...(local.steps ?? []), { heading: '', text: '' }] })}
        >
          + 添加步骤
        </button>
      </div>
    </div>
  );
}
