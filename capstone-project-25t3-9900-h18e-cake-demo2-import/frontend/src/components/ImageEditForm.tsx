// src/components/ImageEditForm.tsx
import { useState } from 'react';
import { getApiBase } from '../lib/fetcher';

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface ImageEditFormProps {
  section: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

// API 地址
// const getApiBaseUrl = () => {
//   const isLocalhost = window.location.hostname === 'localhost' || 
//                        window.location.hostname === '127.0.0.1';
  
//   if (isLocalhost) {
//     return 'http://localhost:8888';
//   } else {
//     return `${window.location.protocol}//${window.location.hostname}:8888`;
//   }
// };

// const API_BASE_URL = getApiBaseUrl();
const API_BASE_URL = getApiBase();
const COMMON_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
};

// export default function ImageEditForm({ section, onSuccess, onCancel }: ImageEditFormProps) {
//   // 解析 section 数据
//   let initialData: { type: string; src: string; alt: string; caption?: string; credit?: string; layout?: string };
//   try {
//     initialData = JSON.parse(section.data);
//   } catch (e) {
//     initialData = { type: 'image', src: '', alt: '' };
//   }

export default function ImageEditForm({ section, onSuccess, onCancel }: ImageEditFormProps) {
  // 解析 section.data
  let initialData: {
    type?: string;
    src?: string;
    alt?: string;
    caption?: string;
    credit?: string;
    layout?: string;
  } = { type: 'image' };
  try {
    if (section.data) initialData = { type: 'image', ...JSON.parse(section.data) };
  } catch {
    // ignore
  }

  const [formData, setFormData] = useState({
    src: initialData.src || '',
    alt: initialData.alt || '',
    caption: initialData.caption || '',
    credit: initialData.credit || '',
    layout: (initialData.layout as string) || 'default'
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 上传图片
  // const handleImageUpload = async (file: File) => {
  //   if (!file || !file.type.startsWith('image/')) {
  //     alert('Please select an image file');
  //     return;
  //   }

  //   try {
  //     setUploading(true);
      
  //     const timestamp = Date.now();
  //     const fileName = `${timestamp}-${file.name}`;
  //     const targetPath = `/media/uploads/${fileName}`;
      
  //     const uploadFormData = new FormData();
  //     uploadFormData.append('file', file);
  //     uploadFormData.append('target_path', targetPath);
      
  //     const response = await fetch(`${API_BASE_URL}/upload`, {
  //       method: 'POST',
  //       body: uploadFormData
  //     });
      
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.detail || 'Upload failed');
  //     }
      
  //     const result = await response.json();
  //     setFormData(prev => ({ ...prev, src: result.url }));
  //     alert('Image uploaded successfully!');
  //   } catch (err) {
  //     alert('Upload failed: ' + (err as Error).message);
  //   } finally {
  //     setUploading(false);
  //   }
  // };
  
  // 上传图片
  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      // 可选：指定保存目标路径；后端若不需要可忽略这个字段
      fd.append('target_path', `/media/uploads/${Date.now()}-${file.name}`);

      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: fd,
        headers: COMMON_HEADERS,
      });
      const okCtype = res.headers.get('content-type') || '';
      const payload = okCtype.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof payload === 'string' ? payload : payload?.detail || 'Upload failed');

      const url = typeof payload === 'string' ? payload : payload.url || payload.path || '';
      if (!url) throw new Error('Upload success but no URL returned.');
      setFormData((p) => ({ ...p, src: url }));
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // 提交表单
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   try {
  //     const dataJson = JSON.stringify({
  //       type: 'image',
  //       ...formData
  //     }, null, 2);
      
  //     const response = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         type: 'image',
  //         data: dataJson,
  //         sort_order: section.sort_order
  //       })
  //     });

  //     if (response.ok) {
  //       alert('Update successful!');
  //       onSuccess();
  //     } else {
  //       throw new Error('Failed to update');
  //     }
  //   } catch (err) {
  //     alert('Failed to update: ' + (err as Error).message);
  //   }
  // };

  // 保存（PATCH /sections/:id）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const dataJson = JSON.stringify({ type: 'image', ...formData }, null, 2);
      const res = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          data: dataJson,
          sort_order: section.sort_order,
        }),
      });
      const ctype = res.headers.get('content-type') || '';
      const payload = ctype.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof payload === 'string' ? payload : payload?.detail || 'Failed to update');

      onSuccess();
    } catch (e: any) {
      alert('Failed to update: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '820', margin: '8px' }}>
      <h3>Edit Image Section</h3>
      <form onSubmit={handleSubmit}>
        {/* 图片 URL */}
        <div style={{ marginBottom: '12' }}>
          <label style={{ display: 'block', marginBottom: '6', fontWeight: '600' }}>
            Image URL *
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input
              type="text"
              value={formData.src}
              onChange={(e) => setFormData((p) => ({ ...p, src: e.target.value }))}
              placeholder="e.g.: /media/uploads/image.jpg or https://..."
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6' }}
              required
            />
            <div>
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <label
                htmlFor="image-upload"
                style={{
                  display: 'inline-block',
                  padding: '8px 15px',
                  background: uploading ? '#6c757d' : '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : '📤 Upload Image'}
              </label>
            </div>
          </div>
        </div>

        {/* 图片预览 */}
        {formData.src && (
          <div style={{ marginBottom: '15px' }}>
            <img
              src={formData.src}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #ddd' }}
            />
          </div>
        )}

        {/* Alt 文本 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Alt Text *
          </label>
          <input
            type="text"
            value={formData.alt}
            onChange={(e) => setFormData((p) => ({ ...p, alt: e.target.value }))}
            placeholder="Image description"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
        </div>

        {/* Caption */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Caption
          </label>
          <textarea
            value={formData.caption}
            onChange={(e) => setFormData((p) => ({ ...p, caption: e.target.value }))}
            placeholder="Image caption text"
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Credit */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Credit
          </label>
          <input
            type="text"
            value={formData.credit}
            onChange={(e) => setFormData((p) => ({ ...p, credit: e.target.value }))}
            placeholder="Image source / copyright info"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Layout */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Layout
          </label>
          <select
            value={formData.layout}
            onChange={(e) => setFormData((p) => ({ ...p, layout: e.target.value }))}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="default">Default</option>
            <option value="full">Full width</option>
            <option value="half">Half width</option>
            <option value="third">One third</option>
            <option value="inline">Inline</option>
            <option value="superfull">Super full width</option>
          </select>
        </div>

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={saving} style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

