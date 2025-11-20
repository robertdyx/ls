// fetcher.ts  —— 统一封装 API 基地址与请求

function readApiBaseFromQuery(): string | null {
  // 1) 先尝试从顶层窗口（demo.html）读取 ?api=
  try {
    const topSearch = (window.top && window.top.location && window.top.location.search) || '';
    const pTop = new URLSearchParams(topSearch);
    const apiTop = pTop.get('api');
    if (apiTop) return decodeURIComponent(apiTop);
  } catch {
    /* ignore */
  }
  // 2) 再尝试当前窗口
  const pSelf = new URLSearchParams(window.location.search);
  const apiSelf = pSelf.get('api');
  if (apiSelf) return decodeURIComponent(apiSelf);
  return null;
}

function normalizeBase(u: string): string {
  let s = u.trim().replace(/\/+$/, ''); // 去掉末尾斜杠
  // ngrok 免费域名默认是 https，确保协议正确
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

export function getApiBase(): string {
  const fromQuery = readApiBaseFromQuery();
  if (fromQuery) return normalizeBase(fromQuery);

  // 兜底：本地开发时走当前 host 的 8888 端口
  const proto = window.location.protocol === 'https:' ? 'https://' : 'http://';
  return `${proto}${window.location.hostname}:8888`;
}

async function doFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = `${base}/${path.replace(/^\/+/, '')}`; // 避免双斜杠
  const res = await fetch(url, {
    // 如需携带 Cookie：credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  // 只对 JSON 解析，避免把 HTML 当 JSON 解析的错误
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // 不是 JSON 时返回原文（调用处自行判断）
  return (await res.text()) as unknown as T;
}

/** 示例导出：按你的接口改成实际路径 */
export const api = {
  getHealth: () => doFetch<{ ok: boolean }>('healthz'),
  getStory: () => doFetch<any>('story'),
  getSections: () => doFetch<any[]>('sections'),
  createSection: (payload: any) =>
    doFetch<any>('sections', { method: 'POST', body: JSON.stringify(payload) }),
  updateSection: (id: string, payload: any) =>
    doFetch<any>(`sections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSection: (id: string) => doFetch<any>(`sections/${id}`, { method: 'DELETE' }),
};
