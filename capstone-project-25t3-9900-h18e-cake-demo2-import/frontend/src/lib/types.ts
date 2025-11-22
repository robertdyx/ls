// src/lib/types.ts
export interface Story {
  id?: number;
  version: string;
  title: string;
  standfirst: string;
  theme: Theme;
  sections: Section[];
}

export interface Theme {
  font: string;
  primaryColor: string;
}

export type Section = 
  | VideoSection 
  | ParagraphSection 
  | PullQuoteSection 
  | ImageSection
  | ImageGroupSection
  | HeroSection
  | ScrollytellingSection;

export interface VideoSection {
  type: 'video';
  src: string;
  poster: string;
  captions?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  credit?: string;
}

export interface ParagraphSection {
  type: 'paragraph';
  content: string;
}

export interface PullQuoteSection {
  type: 'pullquote';
  text: string;
  attribution?: string;
}

export interface ImageSection {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  layout?: ImageData['layout'];
}

export interface ImageGroupSection {
  type: 'imagegroup';
  images: ImageData[];
}

export interface HeroSection {
  type: 'hero';
  title?: string;
  standfirst?: string;
  kicker?: string;
  authorLine?: string;
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  standfirstColor?: string;
  height?: string;
  titleSize?: string;
  standfirstSize?: string;
  alignment?: 'left' | 'center';
}

export interface ImageData {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  layout?: 'full' | 'half' | 'third' | 'inline' | 'default' | 'superfull' | 'third-superfull';
}

export interface ScrollytellingSection {
  type: 'scrollytelling';
  backgroundImages: string[];  // 背景图片序列
  textBlocks: Array<{          // 文字段落
    content: string;
    triggerProgress?: number;  // 在滚动到多少百分比时出现（0-1）
  }>;
  height?: string;  // 总高度，如 "300vh"
}
