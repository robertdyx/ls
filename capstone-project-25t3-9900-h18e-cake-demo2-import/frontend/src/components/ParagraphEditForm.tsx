// src/components/ParagraphEditForm.tsx
import { useState } from 'react';

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface ParagraphEditFormProps {
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

export default function ParagraphEditForm({ section, onSuccess, onCancel }: ParagraphEditFormProps) {
  // 解析 section 数据
  let initialData;
  try {
    initialData = JSON.parse(section.data);
  } catch (e) {
    initialData = { type: 'paragraph', content: '<p>Content</p>' };
  }

  const [formData, setFormData] = useState({
    type: 'paragraph',
    content: initialData.content || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataJson = JSON.stringify(formData, null, 2);
      
      const response = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
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
    <div className="form-container" style={{ maxWidth: '800px', margin: '40px 20px 20px 20px' }}>
      <h3>Edit Paragraph Section</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="paragraph-content">
            Content (HTML supported)
            <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
              You can use HTML tags, e.g. &lt;p&gt;Paragraph text&lt;/p&gt;
            </small>
          </label>
          <textarea
            id="paragraph-content"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            rows={15}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              fontFamily: 'monospace',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            placeholder='e.g.: <p>This is a paragraph.</p>'
          />
        </div>

        {/* 实时预览 */}
        {formData.content && (
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            background: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <strong>Preview:</strong>
            <div 
              style={{ marginTop: '10px' }}
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Save</button>
          <button type="button" onClick={onCancel} style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

