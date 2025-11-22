// import React, { useState } from 'react';
// export type ParagraphData = { type?: 'paragraph'; text: string };
// type Props = {
//   value: ParagraphData;
//   onChange: (next: ParagraphData) => void | Promise<void>;
//   onUpload: (file: File) => Promise<string>; // 未用到，但保持一致签名
// };
// export default function ParagraphEditForm({ value, onChange }: Props) {
//   const [local, setLocal] = useState<ParagraphData>(value ?? { type: 'paragraph', text: '' });
//   const merge = (patch: Partial<ParagraphData>) => {
//     const next = { ...local, ...patch };
//     setLocal(next);
//     onChange(next);
//   };
//   return (
//     <div className="grid gap-2">
//       <label className="text-sm">Text</label>
//       <textarea
//         className="border rounded px-2 py-1 min-h-[8rem]"
//         value={local.text}
//         onChange={e => merge({ text: e.target.value })}
//       />
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from 'react';

export type ParagraphData = {
  type?: 'paragraph';
  text?: string;            // 纯文本（编辑器用）
  content?: string;         // HTML 段落（渲染用）
};

type Props = {
  value: ParagraphData;
  onChange: (next: ParagraphData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>; // 未用到，但保留签名
};

/** <p>..</p><p>..</p> => "段落1\n\n段落2" */
function htmlToPlainParagraphs(html?: string): string {
  if (!html) return '';
  const trimmed = html.trim();
  if (!trimmed) return '';
  // 去掉首尾 <p> 与 </p>，再按段落拆分
  const parts = trimmed
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
    .split(/<\/p>\s*<p>/i)
    .map(s => s.replace(/<[^>]+>/g, '').trim()) // 去除潜在内联标签
    .filter(Boolean);
  return parts.join('\n\n');
}

/** "段落1\n\n段落2" => <p>段落1</p><p>段落2</p> */
function plainToHtmlParagraphs(text?: string): string {
  const parts = String(text ?? '')
    .split(/\n{2,}/)          // 空行分段
    .map(s => s.trim())
    .filter(Boolean);
  if (!parts.length) return '';
  return `<p>${parts.join('</p><p>')}</p>`;
}

export default function ParagraphEditForm({ value, onChange }: Props) {
  // 兼容旧数据：没有 text 时从 content 回填
  const initialText = useMemo(() => {
    if (value?.text && value.text.trim() !== '') return value.text;
    return htmlToPlainParagraphs(value?.content);
  }, [value]);

  const [local, setLocal] = useState<string>(initialText);

  // 外部 value 变化时同步回填
  useEffect(() => {
    setLocal(initialText);
  }, [initialText]);

  const emit = (txt: string) => {
    const next: ParagraphData = {
      ...(value ?? { type: 'paragraph' }),
      type: 'paragraph',
      text: txt,
      content: plainToHtmlParagraphs(txt),
    };
    setLocal(txt);
    onChange(next);
  };

  return (
    <div className="form-card grid gap-2">
      <label className="form-label text-sm font-medium">Text</label>
      <textarea
        className="form-textarea border rounded px-3 py-2 min-h-[8rem] resize-vertical"
        placeholder="在这里输入段落内容（空行分段，保存时自动转换为 <p>…</p>）"
        value={local}
        onChange={(e) => emit(e.target.value)}
      />
      <div className="form-hint text-xs text-gray-500">
        提示：用一行或多行空行来分隔段落；我们会自动同步生成 HTML 至 <code>content</code> 字段。
      </div>
    </div>
  );
}
