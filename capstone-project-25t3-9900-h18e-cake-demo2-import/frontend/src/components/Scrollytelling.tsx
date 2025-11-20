// src/components/Scrollytelling.tsx
import { useEffect, useRef, useState } from 'react';
import { ScrollytellingSection } from '../lib/types';
import './Scrollytelling.css';

export default function Scrollytelling({ 
  backgroundImages,
  textBlocks,
  height = '300vh'
}: ScrollytellingSection) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // 预加载图片
  useEffect(() => {
    const loadImages = async () => {
      const loadPromises = backgroundImages.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });

      try {
        await Promise.all(loadPromises);
        setImagesLoaded(true);
        console.log(`Loaded ${backgroundImages.length} background images`);
      } catch (error) {
        console.error('Failed to load background images:', error);
      }
    };

    loadImages();
  }, [backgroundImages]);

  // 监听滚动，更新背景图片
  useEffect(() => {
    if (!imagesLoaded) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // 计算滚动进度（0-1）
      const scrollProgress = Math.max(
        0,
        Math.min(1, -rect.top / (rect.height - windowHeight))
      );

      // 根据进度计算当前应该显示第几张图片
      const imageIndex = Math.floor(scrollProgress * (backgroundImages.length - 1));
      setCurrentImageIndex(imageIndex);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化

    return () => window.removeEventListener('scroll', handleScroll);
  }, [imagesLoaded, backgroundImages.length]);

  return (
    <div 
      ref={containerRef}
      className="scrollytelling-container"
      style={{ height }}
    >
      {/* 固定的背景图片 - 全屏显示 */}
      <div className="scrollytelling-background">
        {imagesLoaded ? (
          backgroundImages.map((src, index) => (
            <div
              key={index}
              className={`background-image ${index === currentImageIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))
        ) : (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading background images...</p>
          </div>
        )}
      </div>

      {/* 滚动的文字内容 */}
      <div className="scrollytelling-content">
        {textBlocks.map((block, index) => (
          <div 
            key={index}
            className="text-block"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        ))}
      </div>

      {/* 移除调试信息 */}
    </div>
  );
}