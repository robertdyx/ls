// src/lib/fetcher.ts
/**
 * 统一的 API Base 解析与跨域请求封装
 * - 优先读取 ?api= 的完整后端地址（例如 https://xxxx.ngrok-free.dev）
 * - 没有 ?api= 就默认用本地 http://localhost:8888
 * - 自动附加绕过 ngrok 免费域告警页的请求头
 */

export function getApiBaseUrl(): string {
  try {
    const url = new URL(window.location.href);
    const api = url.searchParams.get('api');
    if (api) return decodeURIComponent(api);
  } catch {}
  return 'http://localhost:8888';
}

const defaultHeaders: Record<string, string> = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
};

type FetchJSONOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
};

export async function fetchJSON<T = any>(path: string, options: FetchJSONOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const isWrite = options.method && options.method !== 'GET';
  const headers = {
    ...defaultHeaders,
    ...(isWrite ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: isWrite ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    mode: 'cors',
    credentials: 'omit',
    signal: options.signal,
  });

  // 尝试解析 JSON，不是 JSON 的话回退为 text，并给出更友好的错误提示
  const ctype = res.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const brief = typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200);
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
  }
  return payload as T;
}

/** 读取 Story（/story） */
export function fetchStory() {
  return fetchJSON('/story');
}

/** 你如需在别处用：读取 Sections */
export function fetchSections(storyId: number) {
  return fetchJSON(`/sections?story_id=${storyId}`);
}

/** 其余 CRUD 可按需使用 */
export function createSection(storyId: number, data: any) {
  return fetchJSON('/sections?story_id=' + storyId, { method: 'POST', body: data });
}
export function updateSection(id: number, data: any) {
  return fetchJSON('/sections/' + id, { method: 'PATCH', body: data });
}
export function deleteSection(id: number) {
  return fetchJSON('/sections/' + id, { method: 'DELETE' });
}
