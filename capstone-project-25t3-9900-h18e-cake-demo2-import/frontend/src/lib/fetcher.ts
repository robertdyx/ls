// src/fetcher.ts
type FetcherOptions = RequestInit & { timeoutMs?: number };

function resolveApiBase(): string {
  const sp = new URLSearchParams(window.location.search);
  const fromQuery = sp.get("api");                 // new: ?api=https://xxxx.ngrok-free.dev
  const fromWindow = (window as any).__API_BASE__;  // 可选：父页注入
  // 环境变量（Actions/本地 .env）最后兜底
  const fromEnv = (import.meta as any).env?.VITE_API_BASE;

  // 本地开发兜底：如果是 file:// 就回落到 localhost（仅本地调试用）
  const localFallback =
    location.protocol === "file:" ? "http://127.0.0.1:8888" : undefined;

  return fromQuery || fromWindow || fromEnv || localFallback || "";
}

export const API_BASE = resolveApiBase();

async function withTimeout(p: Promise<Response>, ms = 10000) {
  return Promise.race([
    p,
    new Promise<Response>((_, r) => setTimeout(() => r(new Error("timeout") as any), ms))
  ]) as Promise<Response>;
}

export async function api<T = any>(path: string, opts: FetcherOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error("API base not configured");
  const url = API_BASE.replace(/\/+$/, "") + path;
  const res = await withTimeout(fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  }), opts.timeoutMs ?? 10000);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.headers.get("content-type")?.includes("application/json")
    ? res.json()
    : (res.text() as any);
}

// 可在应用初始化时调用：检查后端是否可达
export async function probeBackend(): Promise<void> {
  if (!API_BASE) throw new Error("API base not configured");
  // 后端已有 /healthz 路由
  await api("/healthz");
}
