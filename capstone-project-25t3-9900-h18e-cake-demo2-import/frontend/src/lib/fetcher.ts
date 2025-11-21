/* fetcher.ts — unified API helper with ngrok bypass header */

/* =========================
 * URL helpers
 * ========================= */

/** 读取 ?api=... 参数，返回以 / 结尾的基础地址 */
export function getApiBase(): string {
  const raw = new URLSearchParams(window.location.search).get('api') || '';
  // 允许传相对路径，但这里统一转成绝对
  try {
    const u = new URL(raw, window.location.href);
    // 强制去掉多余的路径片段，保证以 / 结尾
    return u.origin + (u.pathname.endsWith('/') ? u.pathname.slice(0) : u.pathname + '/');
  } catch {
    // 无效时返回空字符串，后续 fetch 会抛错，便于在 UI 层提示
    return '';
  }
}

/** 将 path 拼成绝对地址（path 可带/不带前导斜杠） */
function joinUrl(path: string): string {
  const base = getApiBase();
  // 允许传完整 URL（用于调试）
  try {
    const asUrl = new URL(path);
    return asUrl.toString();
  } catch {
    // not an absolute url
  }
  const p = path.startsWith('/') ? path.slice(1) : path;
  return base + p;
}

/* =========================
 * Core fetch
 * ========================= */

type Json = any;

interface FetchJsonInit extends RequestInit {
  /** 是否自动把 body 序列化为 JSON */
  json?: boolean;
}

/**
 * 统一的 JSON 请求封装：
 *  - 自动附带 ngrok-skip-browser-warning 头以绕过 ngrok 免费域的拦截页
 *  - CORS 模式、严格引用策略
 *  - 对非 JSON 响应做保护，防止 HTML 拦截页混入
 */
export async function fetchJson(path: string, init: FetchJsonInit = {}): Promise<Json> {
  const url = joinUrl(path);

  const headers = new Headers(init.headers || {});
  // ★ 关键：绕过 ngrok 的浏览器拦截页
  headers.set('ngrok-skip-browser-warning', '1');
  headers.set('X-Requested-With', 'XMLHttpRequest');
  headers.set('Accept', 'application/json');

  // 自动 JSON 序列化（POST/PATCH/PUT 常用）
  const needsJson =
    init.json ||
    (init.body && typeof init.body === 'object' && !(init.body instanceof FormData));

  let body: BodyInit | undefined = init.body as BodyInit | undefined;
  if (needsJson && init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
    body = JSON.stringify(init.body);
  }

  const resp = await fetch(url, {
    ...init,
    headers,
    body,
    mode: 'cors',
    redirect: 'follow',
    referrerPolicy: 'strict-origin-when-cross-origin',
    cache: 'no-store',
  });

  // 204 无内容：直接返回 null
  if (resp.status === 204) return null;

  const ct = resp.headers.get('content-type') || '';
  const text = await resp.text();

  if (!resp.ok) {
    // 后端错误时也尽量尝试解析 JSON
    try {
      const data = ct.includes('application/json') ? JSON.parse(text) : { message: text };
      throw new Error(data?.message || `HTTP ${resp.status}`);
    } catch {
      throw new Error(text || `HTTP ${resp.status}`);
    }
  }

  if (!ct.includes('application/json')) {
    // 依旧拿到 HTML，多半是拦截页或错误网关
    throw new Error(
      `Expect JSON but got ${ct || 'unknown'} from ${url}. Body(head): ${text.slice(0, 200)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
  }
}

/* =========================
 * High-level API
 * ========================= */

/** 获取故事主数据（/story） */
export function fetchStory(): Promise<Json> {
  return fetchJson('/story');
}

/** 列出所有 sections（如你的后端有该路由） */
export function listSections(): Promise<Json> {
  return fetchJson('/sections');
}

/** 新增/保存 section（后端可根据是否带 id 决定新增或更新） */
export function upsertSection(payload: Json): Promise<Json> {
  return fetchJson('/sections', { method: 'POST', body: payload, json: true });
}

/** 更新 section */
export function updateSection(id: string | number, payload: Json): Promise<Json> {
  return fetchJson(`/sections/${id}`, { method: 'PATCH', body: payload, json: true });
}

/** 删除 section */
export function deleteSection(id: string | number): Promise<Json> {
  return fetchJson(`/sections/${id}`, { method: 'DELETE' });
}

/** 导入 JSON 文件（若你的后端实现了 /import） */
export function importJson(data: Json): Promise<Json> {
  return fetchJson('/import', { method: 'POST', body: data, json: true });
}

/* =========================
 * Convenience verbs
 * ========================= */

export const api = {
  get: (path: string) => fetchJson(path),
  post: (path: string, body?: Json) => fetchJson(path, { method: 'POST', body, json: true }),
  patch: (path: string, body?: Json) => fetchJson(path, { method: 'PATCH', body, json: true }),
  del: (path: string) => fetchJson(path, { method: 'DELETE' }),
};
