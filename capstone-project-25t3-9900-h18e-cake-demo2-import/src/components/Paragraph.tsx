// src/components/Paragraph.tsx
import { ParagraphSection } from '../lib/types';
import './Paragraph.css';

export default function Paragraph({ content }: ParagraphSection) {
  return (
    <div 
      className="paragraph-section"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}