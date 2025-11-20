// src/components/ImageGIF.tsx
import type { KeyboardEvent } from 'react';
import { ImageSection } from '../lib/types';
import './ImageGIF.css';
import './ImageGroup.css'; // ✅ 复用布局系统（half/full/third 等）

interface ImageGIFProps extends ImageSection {
  globalIndex?: number;
  onImageClick?: (globalIndex: number) => void;
}

export default function ImageGIF({
  src,
  alt,
  caption,
  credit,
  globalIndex,
  onImageClick,
  layout = 'default',
}: ImageGIFProps) {
  const isGif = /\.gif(?:$|\?)/i.test(src);
  const isInteractive =
    !isGif &&
    typeof onImageClick === 'function' &&
    typeof globalIndex === 'number';

  const figureClassName = `image-container image-gif-container layout-${layout}`;
  const wrapperClassName = `image-gif-wrapper${isInteractive ? ' image-gif-wrapper--interactive' : ''}`;

  const handleActivate = () => {
    if (isInteractive) {
      onImageClick!(globalIndex!);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <figure
      className={figureClassName}
    >
      <div
        className={wrapperClassName}
        onClick={isInteractive ? handleActivate : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={isInteractive ? 'Open image in lightbox' : undefined}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="image-gif"
        />
      </div>

      {(caption || credit) && (
        <figcaption>
          {caption && <span className="caption">{caption}</span>}
          {credit && <span className="credit">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}