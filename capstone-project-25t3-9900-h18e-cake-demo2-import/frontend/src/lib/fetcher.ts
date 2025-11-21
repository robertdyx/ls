// frontend/src/lib/fetcher.ts

type SectionPayload = {
  type: string;
  data?: any;
  sort_order?: number;
};

type Section = {
  id: number;
  type: string;
  data: any;
  sort_order: number;
  story_id: number;
};

type Story = {
  id?: number;
  version?: string;
  title: string;
  standfirst?: string;
  theme?: {
    font?: string;
    primaryColor?: string;
  };
  sections: any[];
};

function normalizeBase(base: string | null | undefined): string {
  if (!base) return "";
  // 去掉最后的 /，防止出现 //story 之类
  return base.replace(/\/+$/, "");
}

export function getApiBaseFromLocation(): string {
  const qs = new URLSearchParams(window.location.search);
  const api = qs.get("api");
  return normalizeBase(api);
}

async function fetchJSON(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  const ctype = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  // 服务器必须返回 JSON；否则就把文本错误抛出来（上次的 “<!DOCTYPE …” 就能被识别）
  if (!ctype.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expect JSON but got ${ctype}. Body: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function urlJoin(base: string, path: string) {
  if (!base) return path; // 同源（本地开发或 gh-pages 同仓库反向代理）
  if (!path.startsWith("/")) path = "/" + path;
  return base + path;
}

/** 优先请求 /story；失败时兜底到 /story.json（保证只读也能展示） */
export async function fetchStory(apiBase?: string): Promise<Story> {
  const base = normalizeBase(apiBase ?? getApiBaseFromLocation());
  try {
    return await fetchJSON(urlJoin(base, "/story"), { credentials: "omit" });
  } catch {
    return await fetchJSON(urlJoin(base, "/story.json"), { credentials: "omit" });
  }
}

export async function listSections(apiBase?: string): Promise<Section[]> {
  const base = normalizeBase(apiBase ?? getApiBaseFromLocation());
  return fetchJSON(urlJoin(base, "/sections"));
}

export async function createSection(
  storyId: number,
  payload: SectionPayload,
  apiBase?: string
): Promise<Section> {
  const base = normalizeBase(apiBase ?? getApiBaseFromLocation());
  const body = { ...payload };
  const qs = new URLSearchParams({ story_id: String(storyId) });
  return fetchJSON(urlJoin(base, `/sections?${qs.toString()}`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateSection(
  sectionId: number,
  patch: Partial<SectionPayload>,
  apiBase?: string
): Promise<Section> {
  const base = normalizeBase(apiBase ?? getApiBaseFromLocation());
  return fetchJSON(urlJoin(base, `/sections/${sectionId}`), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteSection(sectionId: number, apiBase?: string) {
  const base = normalizeBase(apiBase ?? getApiBaseFromLocation());
  return fetchJSON(urlJoin(base, `/sections/${sectionId}`), { method: "DELETE" });
}

// 兼容默认导出 & 具名导出两种引入方式
const api = {
  getApiBaseFromLocation,
  fetchStory,
  listSections,
  createSection,
  updateSection,
  deleteSection,
};
export default api;
