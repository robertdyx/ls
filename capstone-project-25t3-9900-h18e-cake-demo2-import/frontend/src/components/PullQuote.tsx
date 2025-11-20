// src/components/PullQuote.tsx
import { PullQuoteSection } from '../lib/types';
import './PullQuote.css';

export default function PullQuote({ text, attribution }: PullQuoteSection) {
  return (
    <aside className="pull-quote-container">
      <blockquote className="pull-quote">
        {/* 直角框装饰 */}
        <div className="quote-corner-top-right"></div>
        <div className="quote-corner-bottom-left"></div>
        
        <p className="quote-text">{text}</p>
        {attribution && <cite className="quote-attribution">{attribution}</cite>}
      </blockquote>
    </aside>
  );
}