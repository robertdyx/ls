// src/lib/fetcher.ts

/**
 * 统一的后端基址解析：
 * 1) 优先取 URL ?api= 参数
 * 2) 其次取 localStorage('apiBase')
 * 3) 最后回落到 http://localhost:8888
 */
export function getApiBase(): string {
  try {
    const u = new URL(window.location.href);
    const fromQuery = u.searchParams.get('api')?.trim();
    const fromStorage = localStorage.getItem('apiBase')?.trim();

    let base =
      (fromQuery && fromQuery.length > 0 ? fromQuery : fromStorage) ||
      (location.hostname === 'localhost' ? 'http://localhost:8888' : 'http://localhost:8888');

    // 去掉尾部斜杠
    base = base.replace(/\/+$/, '');
    return base;
  } catch {
    return 'http://localhost:8888';
  }
}

// 兼容旧代码：保留一个别名（有人可能还在用 getApiBaseUrl）
export const getApiBaseUrl = getApiBase;

// 统一 headers：用于绕过 ngrok 免费域拦截页，并标记为 fetch 请求
export const COMMON_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
};

// 辅助函数：以 JSON 方式请求，自动拼接基址、自动检查 content-type
async function fetchJson(pathOrUrl: string, init: RequestInit = {}) {
  const isAbs = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbs ? pathOrUrl : `${getApiBase()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;

  const res = await fetch(url, {
    // 以不携带 cookie 的 CORS 请求访问
    mode: 'cors',
    credentials: 'omit',
    // 合并并保留调用方自定义的 headers
    headers: {
      ...COMMON_HEADERS,
      ...(init.headers || {}),
    },
    ...init,
  });

  const ctype = res.headers.get('content-type') || '';
  const isJson = ctype.includes('application/json');

  if (!res.ok) {
    const brief = isJson ? JSON.stringify(await res.json()) : (await res.text()).slice(0, 200);
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${brief}`);
  }

  if (!isJson) {
    const text = await res.text();
    // 这里直接抛错能帮助定位被拦截或返回 HTML 的问题
    const head = text.slice(0, 200);
    throw new Error(`Expect JSON but got ${ctype || 'unknown'} – head: ${head}`);
  }

  return res.json();
}

/** 拉取 story.json（/story） */
export async function fetchStory() {
  return fetchJson('/story', { method: 'GET' });
}

/** 也导出一个可复用的 JSON 请求工具，给其他模块用（可选） */
export async function apiGet(path: string, init: RequestInit = {}) {
  return fetchJson(path, { method: 'GET', ...init });
}
export async function apiPost(path: string, body: any, init: RequestInit = {}) {
  return fetchJson(path, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}
export async function apiPatch(path: string, body: any, init: RequestInit = {}) {
  return fetchJson(path, {
    method: 'PATCH',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}
export async function apiDelete(path: string, init: RequestInit = {}) {
  return fetchJson(path, { method: 'DELETE', ...init });
}
