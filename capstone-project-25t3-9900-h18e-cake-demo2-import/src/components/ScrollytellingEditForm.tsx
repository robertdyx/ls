// src/components/ScrollytellingEditForm.tsx
import { useState } from 'react';

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface ScrollytellingEditFormProps {
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

interface TextBlock {
  content: string;
  triggerProgress?: number;
}

export default function ScrollytellingEditForm({ section, onSuccess, onCancel }: ScrollytellingEditFormProps) {
  // 解析 section 数据
  let initialData: { type: string; backgroundImages: string[]; textBlocks: TextBlock[]; height?: string };
  try {
    initialData = JSON.parse(section.data);
  } catch (e) {
    initialData = { type: 'scrollytelling', backgroundImages: [], textBlocks: [], height: '300vh' };
  }

  const [backgroundImages, setBackgroundImages] = useState<string[]>(initialData.backgroundImages || []);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>(initialData.textBlocks || []);
  const [height, setHeight] = useState(initialData.height || '300vh');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // 上传背景图片
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
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('target_path', targetPath);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: uploadFormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const result = await response.json();
      const newImages = [...backgroundImages];
      newImages[index] = result.url;
      setBackgroundImages(newImages);
      
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setUploadingIndex(null);
    }
  };

  // 添加背景图片
  const handleAddBackgroundImage = () => {
    setBackgroundImages([...backgroundImages, '']);
  };

  // 删除背景图片
  const handleDeleteBackgroundImage = (index: number) => {
    if (confirm('Are you sure you want to delete this background image?')) {
      const newImages = backgroundImages.filter((_, i) => i !== index);
      setBackgroundImages(newImages);
    }
  };

  // 添加文字块
  const handleAddTextBlock = () => {
    setTextBlocks([...textBlocks, { content: '' }]);
  };

  // 删除文字块
  const handleDeleteTextBlock = (index: number) => {
    if (confirm('Are you sure you want to delete this text block?')) {
      const newBlocks = textBlocks.filter((_, i) => i !== index);
      setTextBlocks(newBlocks);
    }
  };

  // 更新文字块内容
  const handleTextBlockChange = (index: number, field: 'content' | 'triggerProgress', value: string | number) => {
    const newBlocks = [...textBlocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setTextBlocks(newBlocks);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataJson = JSON.stringify({
        type: 'scrollytelling',
        backgroundImages: backgroundImages.filter(img => img),
        textBlocks: textBlocks.filter(block => block.content),
        height
      }, null, 2);
      
      const response = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scrollytelling',
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
      <h3>Edit Scrollytelling Section</h3>
      <form onSubmit={handleSubmit}>
        
        {/* 总高度设置 */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Total height
          </label>
          <input
            type="text"
            value={height}
            onChange={e => setHeight(e.target.value)}
            placeholder="e.g.: 300vh"
            style={{ width: '200px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
            Recommended: 300vh - 600vh
          </small>
        </div>

        {/* 背景图片 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4>Background image sequence</h4>
            <button
              type="button"
              onClick={handleAddBackgroundImage}
              style={{
                padding: '8px 15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Add Background Image
            </button>
          </div>

          {backgroundImages.map((imgUrl, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>Background image {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => handleDeleteBackgroundImage(index)}
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

              <div>
                <label>Image URL</label>
                <input
                  type="text"
                  value={imgUrl}
                  onChange={e => {
                    const newImages = [...backgroundImages];
                    newImages[index] = e.target.value;
                    setBackgroundImages(newImages);
                  }}
                  placeholder="e.g.: /media/uploads/bg.jpg"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', marginBottom: '10px' }}
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, index);
                  }}
                  style={{ display: 'none' }}
                  id={`bg-upload-${index}`}
                />
                <label
                  htmlFor={`bg-upload-${index}`}
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

              {imgUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={imgUrl}
                    alt="Background"
                    style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 文字块 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4>Text blocks</h4>
            <button
              type="button"
              onClick={handleAddTextBlock}
              style={{
                padding: '8px 15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Add Text Block
            </button>
          </div>

          {textBlocks.map((block, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>Text block {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => handleDeleteTextBlock(index)}
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

              <div style={{ marginBottom: '10px' }}>
                <label>Content (HTML supported)</label>
                <textarea
                  value={block.content}
                  onChange={e => handleTextBlockChange(index, 'content', e.target.value)}
                  placeholder="e.g.: &lt;p&gt;Text content&lt;/p&gt;"
                  rows={4}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label>Trigger progress (0-1, optional)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={block.triggerProgress ?? ''}
                  onChange={e => handleTextBlockChange(index, 'triggerProgress', parseFloat(e.target.value) || 0)}
                  placeholder="e.g.: 0.5"
                  style={{ width: '200px', padding: '8px', marginTop: '4px' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
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

