// src/components/ImageGroup.tsx
import { ImageData } from '../lib/types';
import './ImageGroup.css';

interface ImageGroupProps {
  images: ImageData[];
  globalStartIndex: number;
  totalImages: number;
  onImageClick: (globalIndex: number) => void;
}

export default function ImageGroup({
  images,
  globalStartIndex,
  onImageClick
}: ImageGroupProps) {
  // ✅ 只检查是否有 third-superfull 布局
  const hasThirdSuperfull = images.some(img => img.layout === 'third-superfull');
  
  // ✅ 如果有 third-superfull,添加 superfull class
  const gridClass = hasThirdSuperfull 
    ? 'image-group-grid superfull' 
    : 'image-group-grid';

  return (
    <div className={gridClass}>
      {images.map((img: ImageData, i: number) => {
        const globalIndex = globalStartIndex + i;

        return (
          <figure
            key={i}
            className={`image-container layout-${img.layout || 'default'}`}
            onClick={() => onImageClick(globalIndex)}
          >
            <div className="image-wrapper">
              <img src={img.src} alt={img.alt} loading="lazy" />
            </div>

            {(img.caption || img.credit) && (
              <figcaption>
                {img.caption && <span className="caption">{img.caption}</span>}
                {img.credit && <span className="credit">{img.credit}</span>}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}