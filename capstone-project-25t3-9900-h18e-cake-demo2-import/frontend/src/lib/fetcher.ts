// frontend/src/lib/fetcher.ts
type Section = {
  id: string | number;
  type: string;
  title?: string;
  content?: string;
  media?: any;
  order?: number;
  [k: string]: any;
};

type Story = {
  id?: string | number;
  title?: string;
  summary?: string;
  sections: Section[];
  [k: string]: any;
};

// 取 API Base：优先当前页面的 ?api=，其次父级 iframe 的 ?api=，最后回退到本地
function resolveApiBase(): string {
  const getApi = (loc: Location | null): string | null => {
    if (!loc) return null;
    const u = new URL(loc.href);
    const v = u.searchParams.get('api');
    return v && v.trim() ? decodeURIComponent(v) : null;
  };

  // 1) 先看当前文档
  let base = getApi(window.location);

  // 2) 如果是被 iframe 嵌入，且当前没拿到，再看父窗口
  if (!base) {
    try {
      base = getApi(window.parent?.location ?? null);
    } catch {
      // 跨域拿不到父窗口也没关系
    }
  }

  // 3) 兜底：本地开发
  if (!base) base = window.location.origin;

  // 4) 规整：去掉末尾 / 与端口加斜杠问题
  return base.replace(/\/+$/, '');
}

const API_BASE = resolveApiBase();

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    credentials: 'omit',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url}\n${text}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expect JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ====== 业务 API ======
export async function healthz(): Promise<{ ok: boolean }> {
  return fetchJSON('/healthz');
}

export async function fetchStory(): Promise<Story> {
  // 允许后端 /story 返回 { sections: [] } / 完整 story
  const data = await fetchJSON<Partial<Story>>('/story');
  return {
    title: data.title ?? '',
    summary: data.summary ?? '',
    sections: Array.isArray(data.sections) ? data.sections : [],
    ...data,
  } as Story;
}

export async function listSections(): Promise<Section[]> {
  const list = await fetchJSON<any[]>('/sections');
  return Array.isArray(list) ? list : [];
}

export async function createSection(payload: Partial<Section>): Promise<Section> {
  return fetchJSON('/sections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSection(id: string | number, payload: Partial<Section>): Promise<Section> {
  return fetchJSON(`/sections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSection(id: string | number): Promise<{ ok: boolean }> {
  return fetchJSON(`/sections/${id}`, { method: 'DELETE' });
}

// 兼容老代码：默认导出一个对象
export default {
  healthz,
  fetchStory,
  listSections,
  createSection,
  updateSection,
  deleteSection,
};
