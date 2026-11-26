import type { Recipe } from '../recipes';
import { buildShoppingList, ingredientInfo, type PantryItem, type PriceOverrides } from './cost';

export type MenuMode = 'day' | 'week' | 'party' | 'saveDay' | 'saveWeek';
export type MenuInput = {
  mode: MenuMode;
  people: number;
  budget?: number | null;
  inventory?: PantryItem[];
  tastes?: string[];
  season?:string;
  nutritionScores?:Readonly<Record<string,number>>;
  wants?: string[];
  pool: Recipe[];
  prices?: PriceOverrides;
};
export type MenuItem = { recipe: Recipe; people: number; role: string };
export type MenuMeal = { name: '早餐' | '午餐' | '晚餐' | '饭局'; items: MenuItem[]; note: string };
export type MenuDay = { day: number; meals: MenuMeal[] };
type Shopping = ReturnType<typeof buildShoppingList>;
export type MenuResult = {
  status: 'ready' | 'overBudget' | 'incomplete'; days: MenuDay[]; shopping: Shopping;
  totalCost: number; shortfall: number | null; reasons: string[]; prepOrder: string[]; serveOrder: string[];
};
type Course = { role: string; pool: Recipe[]; portions: number; shareSoup?: boolean };
type Slot = { name: MenuMeal['name']; courses: Course[] };
type Strategy = { priceWeight: number; repeatWeight: number; tasteWeight: number };
type Quote = { cost: number; missing: boolean; parts: { key: string; quantity: number; pantry: number; cost: number }[] };

const balanced: Strategy = {priceWeight: 0.28, repeatWeight: 10, tasteWeight: 4};
const value: Strategy = {priceWeight: 1, repeatWeight: 2, tasteWeight: 2};
const frugal: Strategy = {priceWeight: 1, repeatWeight: 0, tasteWeight: 0};
const knownModes: MenuMode[] = ['day','week','party','saveDay','saveWeek'];

// A sauce can mark a vegetable dish non-vegetarian. Count substantial animal
// ingredients by edible weight so oyster sauce alone never fills a meat course.
function meatMain(recipe: Recipe): boolean {
  let animalGrams = 0;
  for (const i of recipe.ingredients) {
    const meat = ['肉禽','水产'].includes(ingredientInfo(i.name).category);
    if (!meat || /酱|汁|高汤|猪皮|猪油/.test(i.name)) continue;
    if (/^(?:克|g)$/.test(i.unit)) animalGrams += i.amount;
    else if (/^(?:千克|公斤|kg)$/.test(i.unit)) animalGrams += i.amount*1000;
  }
  return !recipe.vegetarian && animalGrams / recipe.servings >= 55;
}
function beanOrEggMain(recipe: Recipe): boolean {
  return recipe.ingredients.some(i => (/豆腐|豆干|豆腐干|鹰嘴豆/.test(i.name) && i.unit === '克' && i.amount / recipe.servings >= 30) ||
    (i.name === '鸡蛋' && i.unit === '个' && i.amount / recipe.servings >= 0.5));
}
function coursesFor(input: MenuInput): Slot[][] {
  const {people,mode} = input;
  const pool = [...new Map(input.pool.filter(r => !r.alcohol && r.servings > 0 && r.ingredients.length && r.steps.length).map(r => [r.id,r])).values()];
  const staples = pool.filter(r => r.category === '主食');
  const breakfasts = pool.filter(r => /早餐/.test(r.category) || /(?:吐司|司康|小面包|牛奶面包)$/.test(r.title));
  const substantial = (r: Recipe) => r.kcal / r.servings >= 195;
  const grainBreakfast = breakfasts.filter(r => substantial(r) && /米|面|麵|麦|饼|面包|土豆|红薯|玉米|吐司|司康/.test(r.title + r.ingredients.map(i=>i.name).join('')));
  const breakfast = grainBreakfast.length ? grainBreakfast : staples.filter(substantial);
  const hot = pool.filter(r => r.category === '热菜');
  const cold = pool.filter(r => r.category === '凉菜');
  const soups = pool.filter(r => r.category === '汤羹');
  const dessert = pool.filter(r => ['甜品','糖水','烘焙'].includes(r.category) && !/(?:面包|芝士面包|司康)$/.test(r.title));
  const requested = (part: string) => (input.wants || []).some(w=>w.includes(part));
  const course = (role: string, options: Recipe[], portions = people, shareSoup = false): Course => ({role,pool:options,portions,shareSoup});

  if (mode === 'party') {
    const hasCold = requested('凉') || (input.wants === undefined && people >= 4);
    const hasSoup = requested('汤') || (input.wants === undefined && people >= 4);
    const hotCount = (input.wants !== undefined && !requested('热')) ? 0 : Math.max(hasCold && people <= 3 ? 1 : 2, Math.min(8,Math.ceil(people/2)));
    const sidePortions = Math.max(1,Math.ceil(people * 1.45 / Math.max(1,hotCount + Number(hasCold))));
    const courses: Course[] = [];
    // Use vegetarian alternatives for an entirely vegetarian filtered pool.
    const meat = hot.filter(meatMain);
    const veg = hot.filter(r => r.vegetarian);
    if (hasCold) {
      const vegCold = cold.filter(r => r.vegetarian);
      courses.push(course('凉菜',hotCount === 1 ? vegCold : cold,sidePortions));
    }
    for (let i=0; i<hotCount; i++) {
      if (i === 0 && meat.length) courses.push(course('热菜·荤',meat,sidePortions));
      else if (i === 1 || !meat.length) courses.push(course('热菜·素',veg,sidePortions));
      else courses.push(course('热菜',hot,sidePortions));
    }
    if (hasSoup) courses.push(course('汤羹',soups,Math.ceil(people / 2)));
    courses.push(course('主食',staples,people));
    if (requested('甜')) courses.push(course('甜品',dessert,Math.ceil(people / 2)));
    return [[{name:'饭局',courses}]];
  }

  const days = mode === 'week' || mode === 'saveWeek' ? 7 : 1;
  const sides = [...hot,...cold];
  const animalSides = sides.filter(meatMain);
  const proteinSides = animalSides.length ? animalSides : sides.filter(beanOrEggMain);
  const vegetativeSides = sides.filter(r => r.vegetarian && r.ingredients.some(i=>ingredientInfo(i.name).category === '蔬菜' && i.unit === '克' && i.amount/r.servings >= 35));
  const lunchSides = proteinSides.length ? proteinSides : sides;
  const dinnerSides = vegetativeSides.length ? vegetativeSides : sides;
  const economy = mode === 'saveDay' || mode === 'saveWeek';
  return Array.from({length:days}, () => {
    const slots: Slot[] = [
      {name:'早餐',courses:[course('早餐主食',breakfast)]},
      {name:'午餐',courses:[course('主食',staples),course('配菜',lunchSides),course('汤羹',soups)]},
      {name:'晚餐',courses:[course('主食',staples),course('配菜',dinnerSides),course('汤羹',soups,people,economy)]},
    ];
    return slots;
  });
}

function makeQuoter(input: MenuInput) {
  const saved = new Map<string,Quote>();
  return (recipe: Recipe, portions: number): Quote => {
    const key = recipe.id + ':' + portions;
    const existing = saved.get(key);
    if (existing) return existing;
    const list = buildShoppingList([{recipe,people:portions}],input.inventory || [],input.prices);
    const quote: Quote = {
      cost:list.totalCost, missing:list.missingPrices.length>0,
      parts:list.items.map(i=>({key:i.name + '\t' + i.unit,quantity:i.required,pantry:i.available,cost:i.cost ?? 0}))
    };
    saved.set(key,quote);
    return quote;
  };
}
function marginal(quote: Quote, used: Map<string,number>): number {
  let price=0;
  for (const line of quote.parts) {
    if (!line.quantity) continue;
    const remaining = Math.max(0,line.pantry-(used.get(line.key)||0));
    price += line.cost * Math.max(0,line.quantity-remaining)/line.quantity;
  }
  return price;
}
function emptyResult(input: MenuInput, reason: string): MenuResult {
  const shopping = buildShoppingList([],input.inventory || [],input.prices);
  return {status:'incomplete',days:[],shopping,totalCost:0,shortfall:null,reasons:[reason],prepOrder:[],serveOrder:[]};
}

function assemble(input: MenuInput, slots: Slot[][], quoteFor: ReturnType<typeof makeQuoter>, strategy: Strategy): MenuResult {
  const used = new Map<string,number>(), repeats = new Map<string,number>();
  const reasons = new Set<string>();
  const days: MenuDay[] = [];
  for (const [d,dailySlots] of slots.entries()) {
    const day: MenuDay = {day:d+1,meals:[]};
    let lunchSoup: Recipe | undefined;
    const dayDishes = new Set<string>();
    for (const slot of dailySlots) {
      const meal: MenuMeal = {name:slot.name,items:[],note:''};
      const inMeal = new Set<string>();
      for (const course of slot.courses) {
        let best: Recipe | undefined, bestScore=Infinity;
        const shared = course.shareSoup ? lunchSoup : undefined;
        for (const r of shared ? [shared] : course.pool) {
          if (inMeal.has(r.id)) continue;
          const quote=quoteFor(r,course.portions);
          const cost=input.inventory?.length ? marginal(quote,used) : quote.cost;
          const tasteMatch=(input.tastes || []).some(t=>[...r.tastes,...r.tags].some(tag=>tag.includes(t) || t.includes(tag)));
          const count=(repeats.get(r.id)||0) + Number(dayDishes.has(r.id));
          const inSeason=input.season&&r.seasons.some(s=>s===input.season)&&r.seasons.length<4;
          const nutritionWeight=(input.nutritionScores?.[r.id]||0)*(strategy===frugal?0:0.6);
          const score=-nutritionWeight-(inSeason&&strategy!==frugal?1:0)+Number(quote.missing)*1e9 + strategy.priceWeight*cost + strategy.repeatWeight*count - strategy.tasteWeight*Number(tasteMatch);
          if (score < bestScore) { best=r; bestScore=score; }
        }
        if (!best) {
          reasons.add((input.mode === 'party' ? '饭局' : slot.name) + '缺少可选的' + course.role + '。');
          continue;
        }
        const q=quoteFor(best,course.portions);
        for (const part of q.parts) used.set(part.key,(used.get(part.key)||0)+part.quantity);
        meal.items.push({role:course.role,recipe:best,people:course.portions});
        inMeal.add(best.id); dayDishes.add(best.id);
        repeats.set(best.id,(repeats.get(best.id)||0)+1);
        if (slot.name === '午餐' && course.role === '汤羹') lunchSoup=best;
        if (shared) meal.note='午餐煮汤时一并做出晚餐份，预留部分及时分装冷藏，晚餐彻底加热。';
      }
      // Size a small breakfast or light lunch by increasing an actual staple.
      // These are working kitchen portions, not an individual calorie prescription.
      const staple=meal.items.find(i=>i.role==='主食' || i.role==='早餐主食');
      if (slot.name!=='饭局' && staple && meal.items.length===slot.courses.length) {
        const energy=meal.items.reduce((n,i)=>n+i.recipe.kcal/i.recipe.servings*i.people,0);
        const target=(slot.name==='早餐' ? 320 : 570)*input.people;
        const perServing=staple.recipe.kcal/staple.recipe.servings;
        if (energy<target && perServing>0) {
          const extra=Math.ceil((target-energy)/perServing*4)/4;
          staple.people+=extra;
          for (const part of quoteFor(staple.recipe,extra).parts) used.set(part.key,(used.get(part.key)||0)+part.quantity);
          meal.note+=(meal.note ? ' ' : '')+'这餐较清淡，主食按 '+staple.people+' 人份备料。';
        }
      }
      day.meals.push(meal);
    }
    days.push(day);
  }
  const selection=days.flatMap(day=>day.meals.flatMap(meal=>meal.items));
  const shopping=buildShoppingList(selection,input.inventory || [],input.prices);
  if (shopping.missingPrices.length) reasons.add('待补价格：'+shopping.missingPrices.join('、')+'。补价后再核算预算。');
  const cost=shopping.purchaseCost;
  const capped=typeof input.budget === 'number';
  const shortfall=shopping.missingPrices.length || reasons.size ? null : capped ? Math.max(0,Math.round((cost-input.budget!)*100)/100) : 0;
  const status = reasons.size ? 'incomplete' : shortfall && shortfall > 0 ? 'overBudget' : 'ready';
  if (status==='overBudget') reasons.add('当前完整搭配按库存抵扣后的补购估价仍超出本期预算。');
  let prepOrder: string[] = [], serveOrder: string[] = [];
  if (input.mode==='party') {
    const byPrep = [...selection].sort((a,b)=>b.recipe.time-a.recipe.time);
    prepOrder=byPrep.map(i=>i.recipe.title+'（'+i.recipe.time+' 分钟）');
    const rank = (role: string) => role==='凉菜' ? 0 : role.startsWith('热菜') ? 1 : role==='汤羹' ? 2 : role==='主食' ? 3 : 4;
    serveOrder=[...selection].sort((a,b)=>rank(a.role)-rank(b.role)).map(i=>i.role+' · '+i.recipe.title);
  }
  return {status,days,shopping,totalCost:cost,shortfall,reasons:[...reasons],prepOrder,serveOrder};
}

/** Pool must already meet the user's safety, dietary and available-equipment filters. */
export function planMenu(input: MenuInput): MenuResult {
  if (!knownModes.includes(input.mode)) return emptyResult(input,'无法识别菜单类型。');
  if (!Number.isInteger(input.people) || input.people<1) return emptyResult(input,'用餐人数须为正整数。');
  if (input.budget!=null && (!Number.isFinite(input.budget) || input.budget<0)) return emptyResult(input,'预算应为非负金额。');
  const slots=coursesFor(input);
  const quote=makeQuoter(input);
  const saving=input.mode.startsWith('save');
  const cap=input.budget ?? Infinity;
  const first=assemble(input,slots,quote,saving ? value : balanced);
  if (!saving && first.status==='ready') return first;
  const economical=assemble(input,slots,quote,frugal);
  // Try several amounts of variety while keeping the requested budget hard.
  const aim=saving ? Math.min(cap,economical.totalCost*1.15+1) : cap;
  let best=first;
  for (const strategy of [value,{priceWeight:1,repeatWeight:0.75,tasteWeight:1},{priceWeight:1,repeatWeight:0.24,tasteWeight:0.35},frugal]) {
    const next=strategy===frugal ? economical : strategy===value && saving ? first : assemble(input,slots,quote,strategy);
    if (next.status==='ready' && next.totalCost<=aim) return next;
    if ((best.status==='incomplete' && next.status!=='incomplete') ||
       (best.status===next.status && next.totalCost<best.totalCost) ||
       (next.status==='ready' && best.status!=='ready')) best=next;
  }
  return best;
}
