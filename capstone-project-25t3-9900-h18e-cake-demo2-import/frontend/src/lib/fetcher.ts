// src/lib/fetcher.ts
// 统一提供 API 基址 & 公共请求工具（含 ngrok 绕过头）

/** 解析 ?api= 参数；未提供时回落到本地 8888 端口 */
function detectApiBase(): string {
  try {
    const u = new URL(window.location.href);
    const raw = u.searchParams.get('api')?.trim();
    if (raw) return raw.replace(/\/+$/, '');
  } catch {}
  // 本地开发回退
  return 'http://localhost:8888';
}

let API_BASE = detectApiBase();

/** 给外部使用（例如 App.tsx / PostEditor.tsx） */
export function getApiBase(): string {
  return API_BASE;
}

/** 可在运行时切换（极少用到） */
export function setApiBase(next: string) {
  API_BASE = (next || '').replace(/\/+$/, '');
}

// —— 通用头：绕过 ngrok 免费域的浏览器警告页 —— //
const NGROK_HEADERS: HeadersInit = {
  'ngrok-skip-browser-warning': '1',
  'x-requested-with': 'fetch',
};

/** 简单 GET JSON：用于拉取 story */
export async function fetchStory() {
  const url = `${getApiBase()}/story`;
  const res = await fetch(url, { headers: NGROK_HEADERS, mode: 'cors', credentials: 'omit' });
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch story: HTTP ${res.status}. ${text.slice(0, 200)}`);
  }
  if (!ctype.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expect JSON but got ${ctype || 'unknown'}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

/** 通用 fetch 封装（可选） */
export async function fetchJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const res = await fetch(input, {
    mode: 'cors',
    credentials: 'omit',
    headers: { ...NGROK_HEADERS, ...(init.headers || {}) },
    ...init,
  });
  const ctype = res.headers.get('content-type') || '';
  const payload = ctype.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} – ${
        typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload).slice(0, 200)
      }`
    );
  }
  return payload;
}
