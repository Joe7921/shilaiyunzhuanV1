import type {Recipe} from './recipes';
const sweetBaking=new Set(['cantonese-bean-mooncake','intl-scone','intl-gingerbread','intl-birthday-cake','intl-pumpkin-pie','world-basque-cheesecake','world-custard-tart','world-margaret-cookies','world-honey-rolls']);
export function isDessert(r:Recipe){return r.category==='甜品'||r.category==='糖水'||sweetBaking.has(r.id)||r.tags.includes('甜品盲盒')}
export function boxPool(candidates:Recipe[],dessert:boolean,quick:boolean,noOven:boolean){
 return candidates.filter(r=>!r.alcohol&&(dessert?isDessert(r):!isDessert(r)&&r.category!=='饮品')&&(!quick||r.time<=30)&&(!noOven||!r.tools.some(t=>t.includes('烤箱'))));
}
export function openBox(pool:Recipe[],seen:string[],last:string|undefined,random=Math.random):{recipe:Recipe;seen:string[]}|null{
 if(!pool.length)return null;
 let history=seen.filter(id=>pool.some(r=>r.id===id)),left=pool.filter(r=>!history.includes(r.id));
 if(!left.length){history=[];left=pool.length>1?pool.filter(r=>r.id!==last):pool}
 const recipe=left[Math.floor(random()*left.length)];
 return {recipe,seen:[...history,recipe.id]};
}
