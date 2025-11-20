// src/lib/fetcher.ts
type Section = {
  id: number;
  type: string;
  title?: string;
  content?: string;
  order?: number;
};
type Story = {
  id: number;
  title: string;
  sections: Section[];
};

// 1) 从 URL ?api= 读取后端根地址，去掉尾部斜杠
const params = new URLSearchParams(window.location.search);
const apiFromQuery = params.get("api");
export const API_BASE = apiFromQuery
  ? decodeURIComponent(apiFromQuery).replace(/\/+$/, "")
  // 本地开发兜底（vite 本地跑时没有 ?api= 也能用）
  : "http://localhost:8888";

// 统一的取 JSON + 抛错
async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
  }
  // 保护：后端若返回 text/html（比如 404 页面），避免 JSON.parse 报 '<'
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const snippet = (await res.text().catch(() => "")).slice(0, 120);
    throw new Error(`Expect JSON but got ${ct || "unknown"}: ${snippet}`);
  }
  return res.json() as Promise<T>;
}

// ---- API 封装 ----
export async function fetchStory(): Promise<Story> {
  const res = await fetch(`${API_BASE}/story`, {
    method: "GET",
    mode: "cors",
  });
  const data = await jsonOrThrow<Story>(res);
  // 防御：保证 sections 一定是数组
  if (!data || !Array.isArray(data.sections)) {
    data.sections = [];
  }
  return data;
}

export async function fetchSections(): Promise<Section[]> {
  const res = await fetch(`${API_BASE}/sections`, { method: "GET", mode: "cors" });
  const data = await jsonOrThrow<Section[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function createSection(payload: Partial<Section>): Promise<Section> {
  const res = await fetch(`${API_BASE}/sections`, {
    method: "POST",
    mode: "cors",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Section>(res);
}

export async function updateSection(id: number, payload: Partial<Section>): Promise<Section> {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method: "PATCH",
    mode: "cors",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Section>(res);
}

export async function deleteSection(id: number): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method: "DELETE",
    mode: "cors",
  });
  await jsonOrThrow<any>(res);
  return { ok: true };
}

// 兼容老代码的默认导出（若其它文件用到了 default）
export default {
  API_BASE,
  fetchStory,
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
};
