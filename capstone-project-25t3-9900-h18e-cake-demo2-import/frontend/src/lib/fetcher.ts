// fetcher.ts —— 统一封装 API 基地址与请求（稳妥版）

function readApiBaseFromQuery(): string | null {
  // 1) 先尝试从顶层窗口（demo.html）读取 ?api=
  try {
    const topWin: any = (typeof window !== 'undefined' && window.top) ? window.top : null;
    const topSearch = topWin && topWin.location ? topWin.location.search : '';
    const pTop = new URLSearchParams(topSearch || '');
    const apiTop = pTop.get('api');
    if (apiTop) return decodeURIComponent(apiTop);
  } catch {
    /* ignore 跨域访问 top 抛错也忽略 */
  }
  // 2) 再尝试当前窗口
  const selfSearch = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
  const pSelf = new URLSearchParams(selfSearch || '');
  const apiSelf = pSelf.get('api');
  if (apiSelf) return decodeURIComponent(apiSelf);
  return null;
}

function normalizeBase(u: string): string {
  let s = (u || '').trim().replace(/\/+$/, ''); // 去掉末尾斜杠
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s; // ngrok 免费域通常走 https
  return s;
}

export function getApiBase(): string {
  const fromQuery = readApiBaseFromQuery();
  if (fromQuery) return normalizeBase(fromQuery) || '';

  // 兜底：本地开发走 8888 端口
  const hasWin = typeof window !== 'undefined';
  const proto = hasWin && window.location && window.location.protocol === 'https:' ? 'https://' : 'http://';
  const host = hasWin && window.location ? window.location.hostname : 'localhost';
  return `${proto}${host}:8888`;
}

export async function request(path: string, init?: RequestInit): Promise<any> {
  const base = getApiBase().replace(/\/+$/, '');
  const url = `${base}/${String(path || '').replace(/^\/+/, '')}`; // 避免双斜杠
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${msg}`);
  }
  return body;
}

// 你页面里会用到的接口
export const api = {
  health: () => request('healthz'),
  story: () => request('story'),
  sections: () => request('sections'),
  createSection: (payload: any) =>
    request('sections', { method: 'POST', body: JSON.stringify(payload) }),
  updateSection: (id: string, payload: any) =>
    request(`sections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSection: (id: string) => request(`sections/${id}`, { method: 'DELETE' }),
};
