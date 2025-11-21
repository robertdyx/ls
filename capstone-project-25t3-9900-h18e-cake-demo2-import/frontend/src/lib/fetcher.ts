// frontend/src/lib/fetcher.ts
/** 解析 ?api=...，默认回落到同源或本地开发端口 */
export function getApiBase(): string {
  const m = new URLSearchParams(location.search).get("api");
  if (m) return decodeURIComponent(m);
  // gh-pages 无后端，同源仅用于本地联调
  return `${location.protocol}//${location.hostname}:8888`;
}

/** 统一加头，解决 ngrok 的防滥用提示页 */
async function request(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("ngrok-skip-browser-warning", "1");
  headers.set("x-requested-with", "fetch");
  return fetch(input, { ...init, headers });
}

/** 拉取 story（前台渲染用） */
export async function fetchStory() {
  const base = getApiBase();
  const res = await request(`${base}/story`);
  if (!res.ok) throw new Error(`GET /story ${res.status}`);
  return res.json();
}

/** 右侧编辑器：列出 sections */
export async function listSections(params: { story_id?: number } = {}) {
  const base = getApiBase();
  const q = new URLSearchParams();
  if (params.story_id) q.set("story_id", String(params.story_id));
  const url = q.toString() ? `${base}/sections?${q}` : `${base}/sections`;
  const res = await request(url);
  if (!res.ok) throw new Error(`GET /sections ${res.status}`);
  return res.json();
}

/** 新增 section */
export async function createSection(storyId: number, payload: { type: string; data?: string; sort_order?: number }) {
  const base = getApiBase();
  const res = await request(`${base}/sections?story_id=${storyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /sections ${res.status} ${await res.text()}`);
  return res.json();
}

/** 更新 section */
export async function updateSection(id: number, payload: { type?: string; data?: string; sort_order?: number }) {
  const base = getApiBase();
  const res = await request(`${base}/sections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PATCH /sections/${id} ${res.status} ${await res.text()}`);
  return res.json();
}

/** 删除 section */
export async function deleteSection(id: number) {
  const base = getApiBase();
  const res = await request(`${base}/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /sections/${id} ${res.status}`);
  return res.json();
}
