import type { Recipe } from './recipes';

export type Birth = {date:string; time:string};
export const signs = ['摩羯','水瓶','双鱼','白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手'] as const;
const cutoffs = [20,19,21,20,21,21,23,23,23,23,22,22];
export function zodiac(date: string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const actual=new Date(date+'T12:00:00Z');
  if(!Number.isFinite(actual.getTime()) || actual.toISOString().slice(0,10)!==date) return null;
  const month=actual.getUTCMonth();
  const index=(month+Number(actual.getUTCDate()>=cutoffs[month]))%12;
  return {name:signs[index]+'座',index};
}
function hash(input:string) {
  let n=2166136261;
  for(const c of input) n=Math.imul(n^c.charCodeAt(0),16777619);
  return n>>>0;
}
export function seasonOf(day:string) {
  const month=Number(day.slice(5,7));
  return month<=2 || month===12?'冬':month<=5?'春':month<=8?'夏':'秋';
}
export function fortuneFor(birth:Birth,day:string,candidates:Recipe[],preferredTastes:string[]=[]) {
  const sign=zodiac(birth.date);
  if(!sign || !day || birth.date>day) return null;
  const seed=[day,birth.date,birth.time||'unknown'].join('|');
  const season=seasonOf(day);
  const ordered=[...candidates].filter(r=>!r.alcohol).sort((a,b)=>a.id.localeCompare(b.id,'en'));
  const dessert=(r:Recipe)=>/甜品|糖水|甜点|甜饮/.test(r.category)||(r.category==='烘焙'&&/蛋糕|派|饼干|月饼|姜饼|蛋挞|司康/.test(r.title));
  const drink=(r:Recipe)=>/饮品|饮料|热饮|茶饮/.test(r.category);
  const main=ordered.filter(r=>!dessert(r)&&!drink(r));
  if(!main.length) return null;
  const colors=['red','yellow','green','orange','white'];
  const targetColor=colors[hash(seed+'color')%5];
  const targetTaste=preferredTastes.length?preferredTastes[hash(seed+'taste')%preferredTastes.length]:main[hash(seed+'taste')%main.length].tastes[0];
  const targetIngredient=main[hash(seed+'ingredient')%main.length].luckyIngredient;
  function score(r:Recipe) {
    return (r.color===targetColor?4:0)+(r.seasons.includes(season)?2:0)+(r.tastes.includes(targetTaste)?4:0)+(r.ingredients.some(i=>i.name.includes(targetIngredient))?3:0)+hash(seed+'|'+r.id)/4294967296*4;
  }
  const ranked=main.map(recipe=>({recipe,score:score(recipe)})).sort((a,b)=>b.score-a.score).map(x=>x.recipe);
  const chosen=ranked[0];
  const pick=(items:Recipe[],key:string)=>items.length?items[hash(seed+key)%items.length]:null;
  const dessertChoice=pick(ordered.filter(dessert),'dessert');
  const drinkChoice=pick(ordered.filter(r=>drink(r)&&r.id!==dessertChoice?.id),'drink');
  const tastes=chosen.tastes.filter(Boolean);
  const taste=tastes.includes(targetTaste)?targetTaste:tastes[0];
  const ingredient=chosen.ingredients.find(i=>i.name.includes(targetIngredient))?.name || chosen.luckyIngredient;
  const messages=['今天适合慢慢掌勺，把熟悉的味道做得更顺口。','给今天的餐桌留个小惊喜，先从一种喜欢的食材开始。','今天的好胃口适合分享，多摆一副碗筷也很好。','挑一首喜欢的歌，让备菜的几分钟也变成自己的时间。'];
  return {main:chosen,alternatives:ranked.slice(1,4),dessert:dessertChoice,drink:drinkChoice,sign,
    number:hash(seed+'number')%99+1,color:chosen.colorName,ingredient,taste,day,
    message:messages[hash(seed+'mood')%messages.length],
    reason:ingredient+'搭配'+taste+'口味，和今天的'+chosen.colorName+'同桌。'+(chosen.seasons.includes(season)?'这道菜也适合'+season+'天做。':'')+(preferredTastes.includes(taste)?'它还合你的口味偏好。':'')};
}
export type Reading = NonNullable<ReturnType<typeof fortuneFor>>;

