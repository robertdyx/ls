// src/components/ImageGroupEditForm.tsx
import { useState } from 'react';

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface ImageData {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  layout?: 'full' | 'half' | 'third' | 'inline' | 'default' | 'superfull' | 'third-superfull';
}

interface ImageGroupEditFormProps {
  section: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

// API 地址
const getApiBaseUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    return 'http://localhost:8888';
  } else {
    return `${window.location.protocol}//${window.location.hostname}:8888`;
  }
};

const API_BASE_URL = getApiBaseUrl();

export default function ImageGroupEditForm({ section, onSuccess, onCancel }: ImageGroupEditFormProps) {
  // 解析 section 数据
  let initialData: { type: string; images: ImageData[] };
  try {
    initialData = JSON.parse(section.data);
  } catch (e) {
    initialData = { type: 'imagegroup', images: [] };
  }

  const [images, setImages] = useState<ImageData[]>(initialData.images || []);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // 上传图片
  const handleImageUpload = async (file: File, index: number) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploadingIndex(index);
      
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const targetPath = `/media/uploads/${fileName}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_path', targetPath);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const result = await response.json();
      const newImages = [...images];
      newImages[index] = { ...newImages[index], src: result.url };
      setImages(newImages);
      
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setUploadingIndex(null);
    }
  };

  // 添加新图片
  const handleAddImage = () => {
    setImages([...images, {
      src: '',
      alt: '',
      caption: '',
      credit: '',
      layout: 'default'
    }]);
  };

  // 删除图片
  const handleDeleteImage = (index: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    }
  };

  // 更新图片信息
  const handleImageChange = (index: number, field: keyof ImageData, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataJson = JSON.stringify({
        type: 'imagegroup',
        images: images.filter(img => img.src) // Only keep images with a source
      }, null, 2);
      
      const response = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'imagegroup',
          data: dataJson,
          sort_order: section.sort_order
        })
      });

      if (response.ok) {
        alert('Update successful!');
        onSuccess();
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      alert('Failed to update: ' + (err as Error).message);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '900px', margin: '40px 20px 20px 20px' }}>
      <h3>Edit Image Group Section</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <button type="button" onClick={handleAddImage} style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            + Add Image
          </button>
        </div>

        {images.map((img, index) => (
          <div key={index} style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4>Image {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleDeleteImage(index)}
                style={{
                  padding: '5px 15px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>

            {/* 图片 URL */}
            <div style={{ marginBottom: '10px' }}>
              <label>Image URL</label>
              <input
                type="text"
                value={img.src}
                onChange={e => handleImageChange(index, 'src', e.target.value)}
                placeholder="e.g.: /media/uploads/image.jpg"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            {/* 上传按钮 */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, index);
                }}
                style={{ display: 'none' }}
                id={`image-upload-${index}`}
              />
              <label
                htmlFor={`image-upload-${index}`}
                style={{
                  display: 'inline-block',
                  padding: '8px 15px',
                  background: uploadingIndex === index ? '#6c757d' : '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {uploadingIndex === index ? 'Uploading...' : '📤 Upload Image'}
              </label>
            </div>

            {/* 图片预览 */}
            {img.src && (
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={img.src}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Alt 文本 */}
            <div style={{ marginBottom: '10px' }}>
              <label>Alt Text</label>
              <input
                type="text"
                value={img.alt}
                onChange={e => handleImageChange(index, 'alt', e.target.value)}
                placeholder="Image description"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            {/* Caption */}
            <div style={{ marginBottom: '10px' }}>
              <label>Caption</label>
              <textarea
                value={img.caption || ''}
                onChange={e => handleImageChange(index, 'caption', e.target.value)}
                placeholder="Image caption text"
                rows={2}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            {/* Credit */}
            <div style={{ marginBottom: '10px' }}>
              <label>Credit</label>
              <input
                type="text"
                value={img.credit || ''}
                onChange={e => handleImageChange(index, 'credit', e.target.value)}
                placeholder="Image source / copyright info"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            {/* Layout */}
            <div style={{ marginBottom: '10px' }}>
              <label>Layout</label>
              <select
                value={img.layout || 'default'}
                onChange={e => handleImageChange(index, 'layout', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="default">Default</option>
                <option value="full">Full width</option>
                <option value="half">Half width</option>
                <option value="third">One third</option>
                <option value="inline">Inline</option>
                <option value="superfull">Super full width</option>
                <option value="third-superfull">One third super full width</option>
              </select>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No images yet. Click "Add Image" to get started.
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={images.length === 0} style={{
            padding: '10px 20px',
            background: images.length === 0 ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: images.length === 0 ? 'not-allowed' : 'pointer'
          }}>
            Save
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

