// src/components/PullQuoteEditForm.tsx
import { useState } from 'react';

interface Section {
  id: number;
  story_id: number;
  type: string;
  data: string; // JSON string
  sort_order: number;
}

interface PullQuoteEditFormProps {
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

export default function PullQuoteEditForm({ section, onSuccess, onCancel }: PullQuoteEditFormProps) {
  // 解析 section 数据
  let initialData: { type: string; text: string; attribution?: string };
  try {
    initialData = JSON.parse(section.data);
  } catch (e) {
    initialData = { type: 'pullquote', text: '', attribution: '' };
  }

  const [formData, setFormData] = useState({
    type: 'pullquote',
    text: initialData.text || '',
    attribution: initialData.attribution || ''
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
      <h3>Edit Pull Quote Section</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="pullquote-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Quote
          </label>
          <textarea
            id="pullquote-text"
            value={formData.text}
            onChange={e => setFormData({ ...formData, text: e.target.value })}
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontStyle: 'italic'
            }}
            placeholder='Enter the quote text...'
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="pullquote-attribution" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Attribution (optional)
          </label>
          <input
            type="text"
            id="pullquote-attribution"
            value={formData.attribution}
            onChange={e => setFormData({ ...formData, attribution: e.target.value })}
            placeholder="e.g.: — Famous person"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* 实时预览 */}
        {(formData.text || formData.attribution) && (
          <div style={{ 
            marginTop: '20px',
            padding: '30px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            border: '1px solid #ddd'
          }}>
            <strong>Preview:</strong>
            <blockquote style={{
              marginTop: '15px',
              fontSize: '24px',
              fontStyle: 'italic',
              lineHeight: '1.6',
              borderLeft: '4px solid white',
              paddingLeft: '20px'
            }}>
              {formData.text || '(Enter quote...)'}
            </blockquote>
            {formData.attribution && (
              <p style={{
                marginTop: '15px',
                fontSize: '16px',
                textAlign: 'right'
              }}>
                {formData.attribution}
              </p>
            )}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>Save</button>
          <button type="button" onClick={onCancel} style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

