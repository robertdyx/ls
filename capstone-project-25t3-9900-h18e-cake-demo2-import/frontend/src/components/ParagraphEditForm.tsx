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


// import React, { useEffect, useMemo, useState } from 'react';

// export type ParagraphData = {
//   type?: 'paragraph';
//   text?: string;            // 纯文本（编辑器用）
//   content?: string;         // HTML 段落（渲染用）
// };

// type Props = {
//   value: ParagraphData;
//   onChange: (next: ParagraphData) => void | Promise<void>;
//   onUpload: (file: File) => Promise<string>; // 未用到，但保留签名
// };

// /** <p>..</p><p>..</p> => "段落1\n\n段落2" */
// function htmlToPlainParagraphs(html?: string): string {
//   if (!html) return '';
//   const trimmed = html.trim();
//   if (!trimmed) return '';
//   // 去掉首尾 <p> 与 </p>，再按段落拆分
//   const parts = trimmed
//     .replace(/^<p>/i, '')
//     .replace(/<\/p>$/i, '')
//     .split(/<\/p>\s*<p>/i)
//     .map(s => s.replace(/<[^>]+>/g, '').trim()) // 去除潜在内联标签
//     .filter(Boolean);
//   return parts.join('\n\n');
// }

// /** "段落1\n\n段落2" => <p>段落1</p><p>段落2</p> */
// function plainToHtmlParagraphs(text?: string): string {
//   const parts = String(text ?? '')
//     .split(/\n{2,}/)          // 空行分段
//     .map(s => s.trim())
//     .filter(Boolean);
//   if (!parts.length) return '';
//   return `<p>${parts.join('</p><p>')}</p>`;
// }

// export default function ParagraphEditForm({ value, onChange }: Props) {
//   // 兼容旧数据：没有 text 时从 content 回填
//   const initialText = useMemo(() => {
//     if (value?.text && value.text.trim() !== '') return value.text;
//     return htmlToPlainParagraphs(value?.content);
//   }, [value]);

//   const [local, setLocal] = useState<string>(initialText);

//   // 外部 value 变化时同步回填
//   useEffect(() => {
//     setLocal(initialText);
//   }, [initialText]);

//   const emit = (txt: string) => {
//     const next: ParagraphData = {
//       ...(value ?? { type: 'paragraph' }),
//       type: 'paragraph',
//       text: txt,
//       content: plainToHtmlParagraphs(txt),
//     };
//     setLocal(txt);
//     onChange(next);
//   };

//   return (
//     <div className="form-card grid gap-2">
//       <label className="form-label text-sm font-medium">Text</label>
//       <textarea
//         className="form-textarea border rounded px-3 py-2 min-h-[8rem] resize-vertical"
//         placeholder="在这里输入段落内容（空行分段，保存时自动转换为 <p>…</p>）"
//         value={local}
//         onChange={(e) => emit(e.target.value)}
//       />
//       <div className="form-hint text-xs text-gray-500">
//         提示：用一行或多行空行来分隔段落；我们会自动同步生成 HTML 至 <code>content</code> 字段。
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from 'react';

export type ParagraphData = {
  type?: 'paragraph';
  text?: string;     // 纯文本（编辑器输入）
  content?: string;  // HTML 段落（渲染用）
};

type Props = {
  value: ParagraphData;
  onChange: (next: ParagraphData) => void | Promise<void>;
  onUpload: (file: File) => Promise<string>; // 未使用，但保留签名以兼容父组件
};

/** <p>..</p><p>..</p> => "段落1\n\n段落2" */
function htmlToPlainParagraphs(html?: string): string {
  if (!html) return '';
  const trimmed = html.trim();
  if (!trimmed) return '';
  const parts = trimmed
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
    .split(/<\/p>\s*<p>/i)
    .map(s => s.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  return parts.join('\n\n');
}

/** "段落1\n\n段落2" => <p>段落1</p><p>段落2</p> */
function plainToHtmlParagraphs(text?: string): string {
  const parts = String(text ?? '')
    .split(/\n{2,}/) // 空行分段
    .map(s => s.trim())
    .filter(Boolean);
  if (!parts.length) return '';
  return `<p>${parts.join('</p><p>')}</p>`;
}

export default function ParagraphEditForm({ value, onChange }: Props) {
  // 进入编辑时的“原始快照”
  const snapshotText = useMemo(() => {
    if (value?.text && value.text.trim() !== '') return value.text;
    return htmlToPlainParagraphs(value?.content);
  }, [value]);

  // 本地可编辑状态（未确认前不写回父级）
  const [localText, setLocalText] = useState<string>(snapshotText);

  // 外部 value 更新时，重置快照与本地值
  useEffect(() => {
    setLocalText(snapshotText);
  }, [snapshotText]);

  // 确认：把编辑结果写回（同时维护 text 与 content）
  const handleConfirm = async () => {
    const next: ParagraphData = {
      ...(value ?? { type: 'paragraph' }),
      type: 'paragraph',
      text: localText,
      content: plainToHtmlParagraphs(localText),
    };
    await onChange(next);
  };

  // 取消：丢弃本地更改，恢复快照
  const handleCancel = () => {
    setLocalText(snapshotText);
  };

  return (
    <div
      className="paragraph-card"
      style={{
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        background: '#fff',
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <label
          className="form-label"
          style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}
        >
          Text
        </label>

        <textarea
          className="form-textarea"
          style={{
            width: '100%',
            minHeight: 140,
            resize: 'vertical',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8,
            padding: '10px 12px',
            lineHeight: 1.6,
            fontSize: 14,
          }}
          placeholder="在这里输入段落内容（空行分段；保存时会自动转换为<p>…</p>）"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
        />

        <div
          className="form-hint"
          style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}
        >
          提示：用<strong>空行</strong>分隔段落；发布/预览时将使用 <code>&lt;p&gt;</code>{' '}
          标签渲染到 <code>content</code> 字段。
        </div>
      </div>

      {/* 底部操作区 */}
      <div
        className="paragraph-actions"
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          marginTop: 12,
        }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: 'none',
            background:
              'linear-gradient(180deg, #10b981 0%, #059669 100%)', // 绿色确认按钮
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          确认
        </button>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.15)',
            background: '#fff',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          取消
        </button>

        
      </div>
    </div>
  );
}
