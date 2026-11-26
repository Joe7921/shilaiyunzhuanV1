import type { Recipe } from './recipes';

export type User = { id: string; name: string };
export type Preferences = { excluded: string[]; maxTime: number; vegetarian: boolean; avoid?: string[]; tastes?: string[] };
export type Post = { id: string; title: string; body: string; imageUrl: string | null; recipeId: string | null; kcal: number | null; visibility: 'private' | 'community'; authorName: string; createdAt: string; likes: number; likedByMe: boolean; isMine: boolean };
export type Poll = { id: string; title: string; options: { id: string; label: string; votes: number }[]; totalVotes: number; myVote: string | null };
export const defaultPrefs: Preferences = { excluded: [], maxTime: 0, vegetarian: false };

export async function api<T = Record<string, unknown>>(query: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/kitchen' + query, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
  const data = await response.json() as { error?: string | { message?: string }; message?: string };
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || data.message || '暂时没连上厨房，请稍后再试。');
  return data as T;
}

export function matchesPrefs(recipe: Recipe, prefs: Preferences) {
  if (prefs.maxTime && recipe.time > prefs.maxTime) return false;
  const contents=recipe.ingredients.map(i=>i.name).join('、');
  if (prefs.excluded.some(a=>recipe.allergens.includes(a) || (a==='甲壳类'&&recipe.allergens.includes('虾')))) return false;
  if ((prefs.avoid || []).some(a=>[contents,recipe.title,recipe.aliases.join('、')].join('、').includes(a))) return false;
  if (prefs.vegetarian && !recipe.vegetarian) return false;
  return true;
}

export function hash(text: string) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
  return n >>> 0;
}

export function dayKey() {
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(date));
}
