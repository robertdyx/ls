import React, { useState } from 'react';

export type PullQuoteData = { type?: 'pullquote'; text: string; cite?: string };

type Props = {
  value: PullQuoteData;
  onChange: (next: PullQuoteData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>; // 未用到，但保持一致签名
};

export default function PullQuoteEditForm({ value, onChange }: Props) {
  const [local, setLocal] = useState<PullQuoteData>(value ?? { type: 'pullquote', text: '' });

  const merge = (patch: Partial<PullQuoteData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label className="text-sm">Quote</label>
        <textarea
          className="border rounded px-2 py-1 min-h-[6rem]"
          value={local.text}
          onChange={e => merge({ text: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Cite</label>
        <input
          className="border rounded px-2 py-1"
          value={local.cite ?? ''}
          onChange={e => merge({ cite: e.target.value })}
        />
      </div>
    </div>
  );
}
