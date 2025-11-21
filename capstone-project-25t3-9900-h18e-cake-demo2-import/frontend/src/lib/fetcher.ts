// src/lib/fetcher.ts
// 统一从 URL 的 ?api= 读取后端基址，强制使用该基址发请求（绝不走相对路径）

function readApiBaseFromLocation(): string {
  const u = new URL(window.location.href);
  const raw = u.searchParams.get('api') || '';
  if (!raw) {
    throw new Error('Missing "?api=" parameter. Example: demo.html?api=https%3A%2F%2F<your-ngrok>.ngrok-free.dev');
  }
  let base = decodeURIComponent(raw.trim());
  // 规范化：去掉末尾斜杠
  if (base.endsWith('/')) base = base.slice(0, -1);
  try {
    const parsed = new URL(base);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error('API base must start with http/https');
    }
  } catch {
    throw new Error(`Invalid api base: ${base}`);
  }
  return base;
}

let _apiBase: string | null = null;

export function getApiBase(): string {
  if (_apiBase) return _apiBase;
  _apiBase = readApiBaseFromLocation();
  return _apiBase!;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    // 重要：跨域模式下只需要 CORS，且不携带凭据
    mode: 'cors',
    credentials: 'omit',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // 截断以避免过长
    const head = text.slice(0, 200);
    throw new Error(`HTTP ${res.status} for ${url}. Body(head): ${head}`);
  }

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    const head = text.slice(0, 200);
    throw new Error(`Expect JSON but got ${ct || 'unknown'} from ${url}. Body(head): ${head}`);
  }

  return res.json();
}

// ===== 业务 API =====

export async function fetchStory() {
  const base = getApiBase();
  // 只打到绝对地址，禁止使用相对路径
  return fetchJson(`${base}/story`);
}

// 如果后面还需要其它接口，务必同样拼 `${getApiBase()}/xxx` 的绝对 URL。
