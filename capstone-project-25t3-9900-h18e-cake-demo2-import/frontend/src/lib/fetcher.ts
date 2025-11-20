// fetcher.ts
// 读取 ?api= 后端基地址并安全拼接接口；无写死路径，兼顾本地同源调试。

/** 读取并规范化后端基地址（base URL） */
function getApiBase(): string {
  const sp = new URLSearchParams(window.location.search);
  const raw = (sp.get("api") || "").trim();

  if (raw) {
    // 允许 http/https；在 GitHub Pages 场景建议使用 https（ngrok 的 https）
    let base = raw;
    if (!base.endsWith("/")) base += "/";
    return base;
  }
  // 未传 api，则走同源；便于本地起后端时调试
  return "/";
}

const API_BASE = getApiBase();

/** 将相对路径与 base 做合法拼接（支持 /path 与 path 两种写法） */
function apiUrl(path: string): string {
  return new URL(path, API_BASE).toString();
}

/** 统一的 JSON fetch，严格校验响应类型并给出清晰报错 */
async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const resp = await fetch(input, init);
  const ct = resp.headers.get("content-type") || "";

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText} - ${text.slice(0, 200)}`);
  }
  if (ct.includes("application/json")) {
    return resp.json() as Promise<T>;
  }
  const text = await resp.text().catch(() => "");
  throw new Error(`Expect JSON but got ${ct || "unknown"}; body: ${text.slice(0, 200)}`);
}

/** GET/POST 通用方法 */
export async function apiGet<T>(path: string): Promise<T> {
  return jsonFetch<T>(apiUrl(path), { credentials: "omit" });
}
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return jsonFetch<T>(apiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  });
}

/** ========= 你项目里常用到的一些封装（按需使用/改名） ========= */

/** 健康检查：对应后端 /healthz */
export const getHealthz = () => apiGet<{ ok: boolean }>("/healthz");

/** 拉取后端 story（若后端无此路由，自动回退到静态 ./story.json） */
export async function fetchStory(): Promise<any> {
  try {
    return await apiGet<any>("/story");
  } catch (e) {
    // 回退到静态文件，方便演示/离线预览
    const resp = await fetch("./story.json");
    if (!resp.ok) throw e;
    return resp.json();
  }
}

/** 导入 story.json：对应后端 /import（如需别名请改路径） */
export const importStory = (story: unknown) => apiPost<{ ok: boolean }>("/import", story);

/** 帖子增删改查：按你的后端实际路由修改路径 */
export const listPosts   = () => apiGet<any[]>("/posts");
export const createPost  = (data: any) => apiPost<any>("/posts", data);
export const updatePost  = (id: number|string, data: any) =>
  jsonFetch<any>(apiUrl(`/posts/${id}`), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
export const deletePost  = (id: number|string) =>
  jsonFetch<any>(apiUrl(`/posts/${id}`), { method: "DELETE" });

/** 暴露 base，偶尔调试时有用 */
export const API_BASE_URL = API_BASE;
