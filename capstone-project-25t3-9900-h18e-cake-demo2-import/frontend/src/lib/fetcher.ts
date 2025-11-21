// frontend/src/lib/fetcher.ts

// 读取后端基地址：优先取 ?api=，其次取 .env 的 VITE_API_BASE
export function getApiBase(): string {
  try {
    const u = new URL(window.location.href);
    const api = u.searchParams.get('api');
    if (api) {
      // 允许已编码/未编码两种情况
      try {
        return decodeURIComponent(api);
      } catch {
        return api;
      }
    }
  } catch {
    /* noop */
  }
  // 兜底到环境变量（本地开发可用）
  const envBase = (import.meta as any)?.env?.VITE_API_BASE;
  return (envBase as string) || "";
}

// 统一的 JSON 请求封装（自动拼接 base、自动报 JSON 解析错误）
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = base ? `${base.replace(/\/$/, "")}${path}` : path;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();

  // 后端必须返回 JSON；若返回了 HTML/纯文本，这里抛出直观错误（你之前页面上的 “Expect JSON but got text/html …”）
  try {
    return JSON.parse(text) as T;
  } catch {
    const ct = res.headers.get("content-type") || "unknown";
    throw new Error(`Expect JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }
}

/** ======== 下面是前端现用到的 API ========= **/

export type Story = {
  // 只列你页面真实用到的字段即可；若还有字段，按需补充
  sections: any[];
};

// 读取整篇 story（用于首页显示 & 右侧编辑器同步）
export const fetchStory = () => request<Story>("/story");

// 侧栏列表
export const fetchSections = () => request<any[]>("/sections");

// 新增分段
export const createSection = (payload: any) =>
  request<any>("/sections", { method: "POST", body: JSON.stringify(payload) });

// 更新分段
export const updateSection = (id: number | string, payload: any) =>
  request<any>(`/sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// 删除分段
export const deleteSection = (id: number | string) =>
  request<any>(`/sections/${id}`, { method: "DELETE" });

// 导入整篇 story（你页面上的 Import Data 按钮）
export const importStory = (payload: any) =>
  request<any>("/import/story_merged", {
    method: "POST",
    body: JSON.stringify(payload),
  });
