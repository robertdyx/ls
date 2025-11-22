// src/lib/db.ts
import { supabase } from './supabaseClient';

export type ID = number;

/** ---------- stories ---------- */
export async function getLatestStory() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data; // 可能为 null
}

export async function getStoryById(storyId: ID) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
  if (error) throw error;
  return data;
}

export async function createStory(payload: {
  title?: string; version?: string; standfirst?: string;
  theme_font?: string; theme_primary_color?: string;
}) {
  const { data, error } = await supabase
    .from('stories').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateStory(id: ID, patch: Partial<{
  title: string; version: string; standfirst: string;
  theme_font: string; theme_primary_color: string;
}>) {
  const { data, error } = await supabase
    .from('stories').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStory(id: ID) {
  // 外键 ON DELETE CASCADE，会连带删除 sections
  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) throw error;
}

/** ---------- sections ---------- */
export async function listSections(storyId: ID) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSection(storyId: ID, payload: {
  type: string; sort_order?: number; data?: any;
}) {
  const row = { story_id: storyId, type: payload.type,
                sort_order: payload.sort_order ?? 0,
                data: payload.data ?? {} };
  const { data, error } = await supabase
    .from('sections').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateSection(id: ID, patch: Partial<{
  type: string; sort_order: number; data: any;
}>) {
  const { data, error } = await supabase
    .from('sections').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSection(id: ID) {
  const { error } = await supabase.from('sections').delete().eq('id', id);
  if (error) throw error;
}

/** ---------- posts ---------- */
export async function listPosts() {
  const { data, error } = await supabase
    .from('posts').select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPost(payload: {
  title?: string; content?: string; author?: string;
}) {
  const { data, error } = await supabase
    .from('posts').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: ID, patch: Partial<{
  title: string; content: string; author: string; updated_at: string;
}>) {
  const { data, error } = await supabase
    .from('posts').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: ID) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

/** ---------- media ---------- */
export async function listMediaByPost(postId: ID) {
  const { data, error } = await supabase
    .from('media').select('*').eq('post_id', postId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createMedia(payload: {
  post_id: ID; kind: string; url: string;
  caption?: string; alt_text?: string; credit?: string; sort_order?: number;
}) {
  const row = { ...payload, sort_order: payload.sort_order ?? 0 };
  const { data, error } = await supabase
    .from('media').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateMedia(id: ID, patch: Partial<{
  kind: string; url: string; caption: string; alt_text: string; credit: string; sort_order: number;
}>) {
  const { data, error } = await supabase
    .from('media').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMedia(id: ID) {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
}
