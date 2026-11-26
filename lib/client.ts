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

// Match common kitchen names and cuts when the user excludes a whole ingredient.
const ingredientFamilies: Record<string, RegExp> = {
  牛肉: /牛肉|肥牛|牛腩|牛腱|牛排|牛柳|牛里脊|牛肋|牛肩|牛筋|牛骨/,
  猪肉: /猪|五花肉|梅花肉|后腿肉|前腿肉|排骨|里脊肉|腊肠|培根|午餐肉/,
  鸡肉: /鸡肉|鸡丁|鸡块|鸡胸|鸡腿(?!菇)|鸡翅|鸡爪|鸡架|鸡骨|鸡汤|鸡丝|整鸡|童子鸡|三黄鸡/,
  羊肉: /羊肉|羊排|羊腿|羊腩|羊脊|羊蝎|羊骨/,
  鱼肉: /鲈|鳜|鲤|鳊|鲮|鲫|鳕|鲑|鲣|鲭|鲷|三文鱼|金枪鱼|龙利鱼|鱼肉|鱼片|鱼丸|鱼糜|鱼头|鱼露/,
  香菜: /香菜|芫荽/, 番茄: /番茄|西红柿/, 西红柿: /番茄|西红柿/,
  酒精: /啤酒|料酒|干红葡萄酒|黄酒|米酒|白酒|白兰地|朗姆酒/,
};
const commonAllergens: Record<string,string> = {
  牛奶:'奶', 乳制品:'奶', 乳蛋白:'奶', 鸡蛋:'蛋', 花生:'花生', 芝麻:'芝麻', 小麦:'小麦',
  大豆:'大豆', 黄豆:'大豆', 坚果:'坚果', 虾:'虾', 甲壳类:'甲壳类', 鱼肉:'鱼', 贝类:'贝类',
};
export function matchesPrefs(recipe: Recipe, prefs: Preferences) {
  if (prefs.maxTime && recipe.time > prefs.maxTime) return false;
  const contents=recipe.ingredients.map(i=>i.name).join('、');
  if (prefs.excluded.some(a=>recipe.allergens.includes(a) || (a==='甲壳类'&&recipe.allergens.includes('虾')))) return false;
  const searchable = [contents,recipe.title,...recipe.aliases].join('、');
  if (prefs.avoid?.some(value => {
    const term = value.trim();
    if (!term) return false;
    if (term === '酒精') return Boolean(recipe.alcohol) || ingredientFamilies.酒精.test(contents.replace(/无酒精[^、]*/g,''));
    return searchable.includes(term) || ingredientFamilies[term]?.test(contents)
      || recipe.allergens.includes(commonAllergens[term]);
  })) return false;
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
