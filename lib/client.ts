import type { Recipe } from './recipes';

export type User = { id: string; name: string };
export type Preferences = { excluded: string[]; maxTime: number; vegetarian: boolean };
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
  if (prefs.excluded.some((a) => recipe.allergens.includes(a))) return false;
  if (prefs.vegetarian && recipe.ingredients.some((i) => /鸡腿|鸡胸|鸡翅|鸡肉|牛肉|肥牛|猪肉|五花肉|虾|鱼|培根|火腿|蚝油/.test(i.name))) return false;
  return true;
}

export function hash(text: string) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
  return n >>> 0;
}

export function dayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function foodImagePosition(id: string) {
  return ({ 'tomato-eggs': '0% 0%', 'teriyaki-chicken': '100% 0%', 'shrimp-broccoli': '0% 100%', 'chicken-curry': '100% 100%' } as Record<string, string>)[id];
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(date));
}
