// src/lib/fetcher.ts
import { Story } from './types';
import { getLatestStory, listSections } from './db';

export async function fetchStory(): Promise<Story> {
  // 1) 从 Supabase 拿最新 story
  const storyRow = await getLatestStory();
  if (storyRow) {
    const sections = await listSections(storyRow.id);

    const story: Story = {
      id: storyRow.id,
      version: storyRow.version ?? '',
      title: storyRow.title ?? '',
      standfirst: storyRow.standfirst ?? '',
      theme: {
        font: storyRow.theme_font ?? 'Inter',
        primaryColor: storyRow.theme_primary_color ?? '#0f766e',
      },
      sections: (sections ?? []).map((s: any) =>
        typeof s.data === 'string' ? JSON.parse(s.data) : s.data
      ),
    };

    return story;
  }

  // 2) 若数据库为空，回退到本地 story.json
  const resp = await fetch('/story.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const local: Story = await resp.json();
  return local;
}
