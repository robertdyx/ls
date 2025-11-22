import React, { useState } from 'react';

export type ParagraphData = { type?: 'paragraph'; text: string };

type Props = {
  value: ParagraphData;
  onChange: (next: ParagraphData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>; // 未用到，但保持一致签名
};

export default function ParagraphEditForm({ value, onChange }: Props) {
  const [local, setLocal] = useState<ParagraphData>(value ?? { type: 'paragraph', text: '' });

  const merge = (patch: Partial<ParagraphData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm">Text</label>
      <textarea
        className="border rounded px-2 py-1 min-h-[8rem]"
        value={local.text}
        onChange={e => merge({ text: e.target.value })}
      />
    </div>
  );
}
