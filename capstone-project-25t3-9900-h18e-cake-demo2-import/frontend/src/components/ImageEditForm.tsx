import React, { useMemo, useState } from "react";
import { getApiBase, json, ok } from "../lib/fetcher";

type ImageForm = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  layout?: "default" | "third" | "inline";
};

interface Props {
  sectionId: number;
  initial?: ImageForm;
  onClose: () => void;
  onSaved: () => void; // 刷新右侧列表与主视图
}

function toAbsolute(u: string, apiBase: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const b = apiBase.replace(/\/$/, "");
  const p = u.startsWith("/") ? u : `/${u}`;
  return `${b}${p}`;
}

export default function ImageEditForm({ sectionId, initial, onClose, onSaved }: Props) {
  const apiBase = getApiBase();
  const [form, setForm] = useState<ImageForm>({
    url: initial?.url ?? "",
    alt: initial?.alt ?? "",
    caption: initial?.caption ?? "",
    credit: initial?.credit ?? "",
    layout: (initial?.layout as any) ?? "default",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewSrc = useMemo(() => toAbsolute(form.url, apiBase), [form.url, apiBase]);

  async function handleUpload() {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (!input.files || !input.files[0]) return;
        setUploading(true);
        try {
          const fd = new FormData();
          fd.append("file", input.files[0]);
          const res = await fetch(`${apiBase}/files`, {
            method: "POST",
            body: fd,
            headers: { "ngrok-skip-browser-warning": "1" },
          });
          ok(res);
          const data = await res.json();
          // 后端通常返回 { path: "/media/uploads/xxx.jpg" }
          const absolute = toAbsolute(data.path || data.url || "", apiBase);
          setForm((s) => ({ ...s, url: absolute }));
        } finally {
          setUploading(false);
        }
      };
      input.click();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    }
  }

  async function handleSave() {
    if (!form.url.trim()) {
      alert("Image URL is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        type: "image",
        // 存绝对 URL，渲染端无脑可用；如你希望库存相对路径，可把 toAbsolute 换成原始字符串
        src: form.url.trim(),
        alt: form.alt?.trim() || "",
        caption: form.caption?.trim() || "",
        credit: form.credit?.trim() || "",
        layout: form.layout || "default",
      };
      const res = await fetch(`${apiBase}/sections/${sectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(body),
      });
      ok(res);
      await json(res);
      onSaved();
      onClose();
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
        <input
          className="flex-1 border rounded px-3 py-2"
          value={form.url}
          onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
          placeholder="https://...  或 /media/uploads/xxx.jpg"
        />
        <button
          type="button"
          className="px-3 py-2 rounded bg-indigo-600 text-white"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      <div className="text-sm text-gray-500">Preview</div>
      <div className="border rounded overflow-hidden">
        {/* 预览用补全后的绝对地址 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt={form.alt || "preview"}
          style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      </div>

      <label className="block text-sm font-medium mt-3">Alt Text *</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={form.alt}
        onChange={(e) => setForm((s) => ({ ...s, alt: e.target.value }))}
        placeholder="Describe the image for accessibility"
      />

      <label className="block text-sm font-medium mt-3">Caption</label>
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={3}
        value={form.caption}
        onChange={(e) => setForm((s) => ({ ...s, caption: e.target.value }))}
      />

      <label className="block text-sm font-medium mt-3">Credit</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={form.credit}
        onChange={(e) => setForm((s) => ({ ...s, credit: e.target.value }))}
        placeholder="Image source / copyright"
      />

      <label className="block text-sm font-medium mt-3">Layout</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={form.layout}
        onChange={(e) => setForm((s) => ({ ...s, layout: e.target.value as any }))}
      >
        <option value="default">Default</option>
        <option value="third">Third</option>
        <option value="inline">Inline</option>
      </select>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
