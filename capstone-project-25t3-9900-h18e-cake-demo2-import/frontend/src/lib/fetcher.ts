// fetcher.ts
// 读取 ?api= 参数，作为后端基址；若无则用当前站点（便于本地联调）
const params = new URLSearchParams(window.location.search);
const apiParam = params.get("api");
const API_BASE = apiParam ? decodeURIComponent(apiParam) : window.location.origin;

// 拼 URL，确保不重复/缺少斜杠
function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function fetchJSON(path: string, init?: RequestInit) {
  const url = joinUrl(API_BASE, path);
  const res = await fetch(url, {
    ...init,
    mode: "cors",
    credentials: "omit",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    // 这里就是你看到的 “Unexpected token < ...” 的根因：拿到了 HTML
    throw new Error(`Expect JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

// === 对外导出你页面用到的请求 ===

// 获取 story.json 兼容格式
export async function fetchStory() {
  // 后端提供 /story（下方也让后端同时暴露 /story.json 以防老代码）
  return fetchJSON("/story");
}

// 其它 CRUD 例子（按你的页面需要选用）
export async function listPosts() {
  return fetchJSON("/posts");
}
export async function readPost(id: number) {
  return fetchJSON(`/posts/${id}`);
}
export async function createPost(payload: any) {
  return fetchJSON("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
