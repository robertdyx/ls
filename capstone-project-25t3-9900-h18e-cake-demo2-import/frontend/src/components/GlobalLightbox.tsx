// src/components/GlobalLightbox.tsx
import { useEffect, useState } from 'react';
import './GlobalLightbox.css';

interface GlobalLightboxProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
    globalIndex: number;
  }>;
  currentIndex: number;
  onClose: () => void;
}

export default function GlobalLightbox({ 
  images, 
  currentIndex: initialIndex, 
  onClose 
}: GlobalLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="lightbox" onClick={onClose}>
      <figure 
        className="lightbox-figure"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ 新增：图片包装器，按钮基于此定位 */}
        <div className="lightbox-image-wrapper">
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="lightbox-image"
          />

          {/* 关闭按钮 - 图片右上角 */}
          <button
            className="lightbox-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* 计数器 - 图片左下角 */}
          <div className="lightbox-counter">
            {currentIndex + 1} of {images.length}
          </div>

          {/* 导航按钮 - 图片右下角 */}
          <div className="lightbox-nav-wrapper">
            <button
              className="lightbox-nav lightbox-nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentIndex === 0}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              className="lightbox-nav lightbox-nav--next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentIndex === images.length - 1}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 说明文字 - 在图片下方 */}
        {(currentImage.caption || currentImage.credit) && (
          <figcaption className="lightbox-caption">
            {currentImage.caption && <p>{currentImage.caption}</p>}
            {currentImage.credit && <span className="credit">{currentImage.credit}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}