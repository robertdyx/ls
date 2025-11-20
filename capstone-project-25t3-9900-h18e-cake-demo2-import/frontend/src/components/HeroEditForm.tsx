import { useMemo, useState } from 'react';
import { Section } from '../lib/types';
import './HeroEditForm.css';

interface HeroEditFormProps {
  section: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

const API_BASE_URL = (function () {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:8888' : `${window.location.protocol}//${window.location.hostname}:8888`;
})();

export default function HeroEditForm({ section, onSuccess, onCancel }: HeroEditFormProps) {
  let initialData: any = { type: 'hero' };
  try {
    initialData = JSON.parse(section.data || '{}');
  } catch (err) {
    console.error('Failed to parse hero data:', err);
  }

  const [formData, setFormData] = useState({
    type: 'hero',
    title: initialData.title || '',
    standfirst: initialData.standfirst || '',
    kicker: initialData.kicker || '',
    authorLine: initialData.authorLine || '',
    backgroundColor: initialData.backgroundColor || '#0b4635',
    textColor: initialData.textColor || '#ffffff',
    titleColor: initialData.titleColor || '',
    standfirstColor: initialData.standfirstColor || '',
    height: initialData.height || '360px',
    titleSize: initialData.titleSize || '',
    standfirstSize: initialData.standfirstSize || '',
    alignment: initialData.alignment || 'center',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const heroPresets = useMemo(
    () => [
      { label: 'Green + White', value: 'classic', background: '#0b4635', text: '#ffffff' },
      { label: 'Navy + Ivory', value: 'navy', background: '#1d3557', text: '#f5f2e9' },
      { label: 'Slate + Sand', value: 'slate', background: '#2f2e35', text: '#f4ede2' },
      { label: 'Orange + Cream', value: 'sunset', background: '#7a2e19', text: '#fff3e0' },
      { label: 'Transparent + Dark', value: 'transparent', background: 'transparent', text: '#1a1a1a' }
    ],
    []
  );

  const backgroundSwatches = useMemo(
    () => [
      { label: 'Dark green', value: '#0b4635' },
      { label: 'Deep navy', value: '#001d3d' },
      { label: 'Slate blue', value: '#1d3557' },
      { label: 'Charcoal', value: '#2d2d2d' },
      { label: 'Burnt orange', value: '#7a2e19' },
      { label: 'Warm gold', value: '#b87900' },
      { label: 'Light ivory', value: '#f5f2e9' },
      { label: 'No background', value: 'transparent' }
    ],
    []
  );

  const textSwatches = useMemo(
    () => [
      { label: 'White', value: '#ffffff' },
      { label: 'Ivory', value: '#f5f2e9' },
      { label: 'Black', value: '#1a1a1a' },
      { label: 'Dark blue', value: '#001233' },
      { label: 'Dark green', value: '#0b4635' }
    ],
    []
  );

  const currentPreset = heroPresets.find(
    preset => preset.background === formData.backgroundColor && preset.text === formData.textColor
  );
  const [presetChoice, setPresetChoice] = useState(currentPreset ? currentPreset.value : 'custom');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hero',
          data: JSON.stringify(formData),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update hero block');
      }

      alert('Hero block updated!');
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="form-container">
      <h3>Edit Hero Block</h3>
      <form onSubmit={handleSubmit} className="hero-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Main headline"
            />
          </div>
          <div className="form-group">
            <label>Subtitle (HTML allowed)</label>
            <textarea
              rows={4}
              value={formData.standfirst}
              onChange={e => handleChange('standfirst', e.target.value)}
              placeholder="<p>Intro paragraph</p>"
            />
          </div>
          <div className="two-column">
            <div className="form-group">
              <label>Author info</label>
              <input
                type="text"
                value={formData.authorLine}
                onChange={e => handleChange('authorLine', e.target.value)}
                placeholder="By Jane Doe | 29 Sep 2025"
              />
            </div>
            <div className="form-group">
              <label>Title font size</label>
              <input
                type="text"
                value={formData.titleSize}
                onChange={e => handleChange('titleSize', e.target.value)}
                placeholder="e.g. 40px or 2.8rem"
              />
            </div>
          </div>
          <div className="two-column">
            <div className="form-group">
              <label>Color style</label>
              <select
                value={presetChoice}
                onChange={e => {
                  const value = e.target.value;
                  setPresetChoice(value);
                  if (value === 'custom') return;
                  const preset = heroPresets.find(p => p.value === value);
                  if (preset) {
                    handleChange('backgroundColor', preset.background);
                    handleChange('textColor', preset.text);
                  }
                }}
              >
                {heroPresets.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          {presetChoice === 'custom' && (
            <>
              <div className="form-group">
                <label>Background color</label>
                <select
                  value={formData.backgroundColor}
                  onChange={e => handleChange('backgroundColor', e.target.value)}
                >
                  {backgroundSwatches.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Text color</label>
                <select
                  value={formData.textColor}
                  onChange={e => handleChange('textColor', e.target.value)}
                >
                  {textSwatches.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="two-column">
            <div className="form-group">
              <label>Title color</label>
              <select
                value={formData.titleColor}
                onChange={e => handleChange('titleColor', e.target.value)}
              >
                <option value="">Use text color</option>
                {textSwatches.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subtitle color</label>
              <select
                value={formData.standfirstColor}
                onChange={e => handleChange('standfirstColor', e.target.value)}
              >
                <option value="">Use text color</option>
                {textSwatches.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subtitle size</label>
              <input
                type="text"
                value={formData.standfirstSize}
                onChange={e => handleChange('standfirstSize', e.target.value)}
                placeholder="e.g. 18px or 1.4rem"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Block height</label>
            <input
              type="text"
              value={formData.height}
              onChange={e => handleChange('height', e.target.value)}
              placeholder="e.g. 320px or 60vh"
            />
          </div>
          <div className="form-group">
            <label>Text alignment</label>
            <select
              value={formData.alignment}
              onChange={e => handleChange('alignment', e.target.value)}
            >
              <option value="center">Center</option>
              <option value="left">Left</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit">Save Hero</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
