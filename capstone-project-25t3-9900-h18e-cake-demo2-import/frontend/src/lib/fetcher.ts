// src/lib/fetcher.ts
import { Story } from './types';

// 动态获取 API 地址，支持跨设备访问
// 如果当前是 localhost，就用 localhost:8888
// 否则使用当前主机名（适合同一局域网内的其他设备访问）
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE?.trim?.();
  if (envUrl) return envUrl;
  const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    return 'http://localhost:8888';
  } else {
    // 使用当前页面的 hostname，端口 8888
    // 例如：如果通过 192.168.1.100:5173 访问，API 就是 http://192.168.1.100:8888
    return `${window.location.protocol}//${window.location.hostname}:8888`;
  }
};

const API_BASE_URL = getApiBaseUrl();

export async function fetchStory(): Promise<Story> {
  try {
    // 优先从后端数据库获取
    const response = await fetch(`${API_BASE_URL}/story`);
    
    if (response.ok) {
      const story: Story = await response.json();
      console.log('✓ Story loaded from database');
      return story;
    }
    
    // 如果数据库没有数据，回退到本地 story.json
    console.log('⚠ Database empty, falling back to local story.json');
    const fallbackResponse = await fetch('/story.json');
    
    if (!fallbackResponse.ok) {
      throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
    }
    
    const story: Story = await fallbackResponse.json();
    return story;
  } catch (error) {
    console.error('Failed to fetch story:', error);
    throw error;
  }
}