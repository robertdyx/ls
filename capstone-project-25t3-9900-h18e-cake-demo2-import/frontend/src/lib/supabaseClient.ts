// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,       // 例如：https://xxxx.supabase.co
  import.meta.env.VITE_SUPABASE_ANON_KEY!   // 你的 anon 公钥
);
