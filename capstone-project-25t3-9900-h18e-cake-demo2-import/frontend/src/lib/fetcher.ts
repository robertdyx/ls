// src/lib/fetcher.ts
/**
 * 读取 ?api=xxx 并构造后端基地址；默认回退到 http://localhost:8888
 * 始终返回绝对 URL，避免相对路径被 GitHub Pages 吸走。
 */
export function getApiBase(): string {
  const params = new URLSearchParams(window.location.search);
  const apiRaw = params.get("api");
  let base = (apiRaw ? decodeURIComponent(apiRaw) : "").trim();

  // 规范化：必须是 http(s) 开头；去掉多余空格
  if (!/^https?:\/\//i.test(base)) {
    base = "";
  }
  // 默认回退（本地调试）
  if (!base) {
    base = "http://localhost:8888";
  }

  // 确保以 / 结尾，用 URL 做规范化避免手拼
  const u = new URL(base);
  return u.toString(); // 标准化后的绝对地址，结尾会带 /
}

/** 用 URL 安全拼接路径（防止多/少斜杠、相对路径问题） */
function buildUrl(path: string): string {
  const base = getApiBase();
  // path 允许 'story'、'/story'、'story.json' 等，统一交给 URL 处理
  return new URL(path.replace(/^\//, ""), base).toString();
}

/** 统一的 JSON fetch（带类型与报错信息） */
async function fetchJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    ...init,
  });

  // 不是 2xx 直接抛错，带上文本以便定位
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} @ ${url}\n${txt.slice(0, 300)}`);
  }

  // 保护：Content-Type 必须像 JSON
  const ct = resp.headers.get("content-type") || "";
  if (!/application\/json/i.test(ct)) {
    const txt = await resp.text().catch(() => "");
    throw new Error(
      `Expect JSON but got ${ct || "unknown"} from ${url}. Body(head): ${txt.slice(0, 200)}`
    );
  }

  return resp.json() as Promise<T>;
}

/** 供页面使用的 API —— 读取故事全文 */
export async function fetchStory() {
  return fetchJSON("story"); // 后端也兼容 /story.json（见 main.py）
}

/** 读取分节列表（如果你的后端有） */
export async function fetchSections() {
  return fetchJSON("sections");
}

/** 读取健康检查 */
export async function fetchHealth() {
  return fetchJSON("healthz");
}

export default {
  getApiBase,
  fetchStory,
  fetchSections,
  fetchHealth,
};
