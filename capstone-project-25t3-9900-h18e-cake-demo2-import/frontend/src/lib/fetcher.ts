// frontend/src/lib/fetcher.ts

// frontend/src/lib/fetcher.ts
// 读取后端根地址：优先 URL ?api=，其次 localStorage.apiBase
export function getApiBase(): string {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('api');
  const api = (fromQuery || localStorage.getItem('apiBase') || '').trim();

  if (fromQuery) {
    // 把 ?api= 保存一下，刷新后仍可用
    localStorage.setItem('apiBase', fromQuery);
  }

  if (!api) throw new Error('No API base provided. Append ?api=<backend_root> to the URL.');
  return api.replace(/\/+$/, ''); // 去掉结尾斜线
}

async function doFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const resp = await fetch(`${base}${path}`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
    ...init,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Request failed ${resp.status}: ${txt || resp.statusText}`);
  }
  return resp.json() as Promise<T>;
}

// 读取 story（后端 /story 或 /story.json 都可以，这里优先 /story）
export async function fetchStory(): Promise<any> {
  try {
    return await doFetch<any>('/story');
  } catch {
    // 某些代理可能只放行 .json，兜底再试 /story.json
    return await doFetch<any>('/story.json');
  }
}

export default {
  getApiBase,
  fetchStory,
};


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
