// src/lib/upload.ts
import { supabase } from './supabaseClient';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'assets';

export async function uploadFile(file: File, folder = 'uploads') {
  const ts = Date.now();
  const path = `${folder}/${ts}-${file.name}`;

  // 上传到 Storage
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false
  });
  if (upErr) throw upErr;

  // 取公开 URL（bucket 要设置为 public 或策略允许 anon 读取）
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
