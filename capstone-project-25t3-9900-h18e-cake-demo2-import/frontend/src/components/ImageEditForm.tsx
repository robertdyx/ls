// frontend/src/components/ImageEditForm.tsx
// 与后端 /files 兼容上传；保存将 JSON 串写入 section.data
// （内容与您现版一致，只是注释与 onError/headers 更细）
import React, { useMemo, useState } from "react";
import { getApiBase } from "../lib/fetcher";

type ImageData = {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
  layout?: "default" | "third" | "inline";
};

type SectionLike = { id: number; data?: string };

function toAbsolute(u: string, apiBase: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const b = apiBase.replace(/\/$/, "");
  const p = u.startsWith("/") ? u : `/${u}`;
  return `${b}${p}`;
}

export default function ImageEditForm({ section, onSuccess, onCancel }: {
  section: SectionLike; onSuccess: () => void; onCancel: () => void;
}) {
  const apiBase = getApiBase();
  let parsed: Partial<ImageData> = {};
  try { parsed = section.data ? JSON.parse(section.data) : {}; } catch {}

  const [form, setForm] = useState<ImageData>({
    src: parsed.src ?? "",
    alt: parsed.alt ?? "",
    caption: parsed.caption ?? "",
    credit: parsed.credit ?? "",
    layout: (parsed.layout as any) ?? "default",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewSrc = useMemo(() => toAbsolute(form.src, apiBase), [form.src, apiBase]);

  async function handleUpload() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", input.files[0]);
        const res = await fetch(`${apiBase}/files`, {
          method: "POST",
          body: fd,
          headers: {
            "ngrok-skip-browser-warning": "1",
            "x-requested-with": "fetch",
          },
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const data = await res.json();
        const next = data.path || data.url || "";
        setForm(s => ({ ...s, src: next }));
      } catch (e) {
        console.error(e);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    if (!form.src.trim()) { alert("Image URL is required"); return; }
    setSaving(true);
    try {
      const payload = {
        type: "image",
        data: JSON.stringify({
          src: form.src.trim(),
          alt: form.alt?.trim() || "",
          caption: form.caption?.trim() || "",
          credit: form.credit?.trim() || "",
          layout: form.layout || "default",
        } as ImageData),
      };
      const res = await fetch(`${apiBase}/sections/${section.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
          "x-requested-with": "fetch",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
      await res.json().catch(() => ({}));
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xl font-semibold">Edit Image Section</h3>

      <label className="block text-sm font-medium">Image URL *</label>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2"
               value={form.src}
               onChange={(e) => setForm(s => ({ ...s, src: e.target.value }))}
               placeholder="https://… 或 /media/uploads/xxx.jpg" />
        <button type="button" className="px-3 py-2 rounded bg-indigo-600 text-white"
                onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload Image"}
        </button>
      </div>

      <div className="text-sm text-gray-500 mt-2">Preview</div>
      <div className="border rounded overflow-hidden">
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={previewSrc}
             style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
             onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
      </div>

      <label className="block text-sm font-medium mt-3">Alt Text *</label>
      <input className="w-full border rounded px-3 py-2"
             value={form.alt}
             onChange={(e) => setForm(s => ({ ...s, alt: e.target.value }))} />

      <label className="block text-sm font-medium mt-3">Caption</label>
      <textarea className="w-full border rounded px-3 py-2" rows={3}
                value={form.caption}
                onChange={(e) => setForm(s => ({ ...s, caption: e.target.value }))} />

      <label className="block text-sm font-medium mt-3">Credit</label>
      <input className="w-full border rounded px-3 py-2"
             value={form.credit}
             onChange={(e) => setForm(s => ({ ...s, credit: e.target.value }))} />

      <label className="block text-sm font-medium mt-3">Layout</label>
      <select className="w-full border rounded px-3 py-2"
              value={form.layout}
              onChange={(e) => setForm(s => ({ ...s, layout: e.target.value as ImageData["layout"] }))}>
        <option value="default">Default</option>
        <option value="third">Third</option>
        <option value="inline">Inline</option>
      </select>

      <div className="flex gap-3 pt-3">
        <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="px-4 py-2 rounded border" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
