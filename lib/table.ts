import {matchesPrefs,type Preferences} from './client';
import {assessNutrition,type NutritionCondition} from './planner/nutrition';
import {recipes,type Recipe} from './recipes';

export const tasteOptions=['咸鲜','酸甜','清淡','麻辣','蒜香','奶香','酱香','香甜'];
export const habitOptions=['蛋奶素','纯素','不吃辣','不吃含酒菜','清真食材'];
export const allergenOptions=[...new Set(['蛋','奶','小麦','大豆','花生','坚果','鱼','虾','甲壳类','贝类','芝麻',...recipes.flatMap(r=>r.allergens)])];
export type Guest={name:string;tastes:string[];favorites:string[];avoid:string[];allergens:string[];habits:string[]};
export const newGuest=():Guest=>({name:'',tastes:[],favorites:[],avoid:[],allergens:[],habits:[]});
export const distinct=(values:string[])=>[...new Set(values)];
export function terms(text:string){return distinct(text.split(/[,，、;；\n]/u).map(v=>v.trim()).filter(Boolean))}
const key=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
const aliases=new Map<string,Recipe|null>();
for(const r of recipes)for(const alias of r.aliases){
  const k=key(alias);
  aliases.set(k,aliases.has(k)&&aliases.get(k)?.id!==r.id?null:r);
}
for(const r of recipes)aliases.set(key(r.title),r);
function dishName(v:string){return aliases.get(key(v))?.title||key(v)}
const tasteFamilies:Record<string,RegExp>={
 咸鲜:/咸鲜|鲜咸|咸香|鲜香/,清淡:/清淡|清鲜|清爽/,麻辣:/麻辣|香辣|酸辣|微辣/,香甜:/香甜|清甜|微甜|果甜/
};
function tasteFits(r:Recipe,t:string){return r.tastes.some(v=>v===t||tasteFamilies[t]?.test(v))}
export function validGuest(p:Guest){
 if(!p.name.trim()||p.name.trim().length>20)return '给这位饭搭子填一个 1–20 字的昵称。';
 if(p.name.match(/[\r\n]/))return '昵称请写在一行。';
 for(const group of [p.favorites,p.avoid,p.tastes,p.habits,p.allergens]){
   if(group.length>30||group.some(t=>t.length>60||/[\r\n、]/.test(t)))return '每栏最多 30 项，每项最多 60 字。';
 }
 return '';
}
const cardRows=[['昵称','name'],['口味','tastes'],['爱吃','favorites'],['忌口','avoid'],['过敏原','allergens'],['习惯','habits']] as const;
export function encodeCard(p:Guest){
 return ['食来运转 · 饭搭子口味卡',...cardRows.map(([title,field])=>title+'：'+(field==='name'?p.name:p[field].join('、')))].join('\n');
}
export function decodeCard(text:string):Guest|null{
 const lines=text.trim().split(/\r?\n/);
 if(text.length>8000||lines.length!==7||lines[0]!=='食来运转 · 饭搭子口味卡')return null;
 const p=newGuest();
 for(const [i,[title,field]] of cardRows.entries()){
  const prefix=title+'：';if(!lines[i+1].startsWith(prefix))return null;
  const v=lines[i+1].slice(prefix.length).trim();
  if(field==='name')p.name=v;else p[field]=terms(v);
 }
 if(validGuest(p)||p.habits.some(h=>!habitOptions.includes(h))||p.allergens.some(a=>!allergenOptions.includes(a)))return null;
 return p;
}

const seafood=/鱼|虾|蟹|蛤|蛏|扇贝|牡蛎|鲍|鱿|章鱼|青口|青花鲭|海参|海蜇|海鲜|蚝油/;
const spicy=/辣椒|小米辣|豆瓣酱|辣酱|咖喱辣|山葵|芥末/;
function fitsGuest(r:Recipe,p:Guest){
 const avoid=p.avoid.map(t=>t.replace(/^(?:不吃|不喜欢吃|忌吃|不要|对)(?=.)/,'').replace(/过敏$/,''));
 const plant=p.habits.includes('纯素'),veggie=plant||p.habits.includes('蛋奶素');
 const conditions:NutritionCondition[]=[];
 if(veggie)conditions.push('素食');
 if(p.habits.includes('清真食材'))conditions.push('清真');
 if(conditions.length&&!assessNutrition(r,conditions).eligible)return false;
 if(plant)avoid.push('蜂蜜','明胶','鱼胶','鱼露','蚝油','猪油');
 if(p.habits.includes('不吃含酒菜'))avoid.push('酒精');
 const ingredients=r.ingredients.map(i=>i.name).join('、');
 if(avoid.some(x=>x==='海鲜'||x==='海产')&&(seafood.test(ingredients)||r.allergens.some(a=>['鱼','虾','甲壳类','贝类'].includes(a))))return false;
 if((p.habits.includes('不吃辣')||avoid.some(x=>x==='辣'||x==='辣味'))&&(r.tastes.some(t=>t.includes('辣'))||spicy.test(ingredients)))return false;
 const excluded=distinct([...p.allergens,...(plant?['蛋','奶']:[]),...avoid.filter(a=>allergenOptions.includes(a))]);
 return matchesPrefs(r,{excluded,vegetarian:veggie,maxTime:0,avoid});
}
function ratio(a:Set<string>,b:Set<string>){
 const union=new Set([...a,...b]);return [...a].filter(x=>b.has(x)).length/union.size;
}
function compatibility(guests:Guest[]){
 let sum=0,pairs=0;
 for(const [i,p] of guests.entries())for(const q of guests.slice(i+1)){
   let value=0,weight=0;
   for(const [field,w] of [['tastes',45],['favorites',40],['habits',15]] as const){
     if(!p[field].length||!q[field].length)continue;
     const norm=field==='favorites'?dishName:key;
     value+=w*ratio(new Set(p[field].map(norm)),new Set(q[field].map(norm)));weight+=w;
   }
   if(!weight)return null;
   sum+=value/weight;pairs++;
 }
 return pairs?Math.round(100*sum/pairs):null;
}
export function tableFor(guests:Guest[],catalog:Recipe[]=recipes){
 const favs=guests.map(p=>new Set(p.favorites.map(dishName)));
 const common=guests.length>=2?[...favs[0]].filter(name=>favs.every(f=>f.has(name))):[];
 const avoid=distinct(guests.flatMap(p=>[...p.avoid,...p.allergens.map(a=>a+'过敏'),...p.habits]));
 const eligible=guests.length<2?[]:catalog.filter(r=>guests.every(p=>fitsGuest(r,p)));
 const rank=(r:Recipe)=>guests.reduce((s,p,i)=>s+(favs[i].has(r.title)?10:0)+Number(p.tastes.some(t=>tasteFits(r,t)))*2,0);
 const pool=eligible.map(r=>({r,rank:rank(r)})).sort((a,b)=>b.rank-a.rank||a.r.time-b.r.time);
 const blocked=distinct(guests.flatMap(p=>p.favorites.map(dishName))).filter(n=>aliases.has(key(n))&&catalog.some(r=>r.title===n)&&!eligible.some(r=>r.title===n));
 return {score:compatibility(guests),common,avoid,blocked,pool,names:guests.map(p=>p.name)};
}
export type Table=ReturnType<typeof tableFor>;
export function tableRemark(score:number|null){
 return score===null?'每人补一项可比较的口味或爱吃的菜，就能测分。':score>=80?'这桌点菜大概只需要一句「老样子」。':score>=50?'有人点熟悉的那道，有人负责发现新菜。':score>0?'口味各有主见，合桌也能点出好菜。':'你们的口味各走各的路，这餐可以一起试一道新的。';
}
// Weighted draws without replacement; every eligible recipe still has a chance.
export function drawTable(pool:Table['pool'],rng=Math.random){
 const left=[...pool],chosen:Recipe[]=[];
 while(left.length&&chosen.length<3){
   const weight=(n:number)=>1+Math.min(5,n/2);
   let pick=rng()*left.reduce((s,p)=>s+weight(p.rank),0);
   let i=left.findIndex(p=>(pick-=weight(p.rank))<0);if(i<0)i=left.length-1;
   chosen.push(left.splice(i,1)[0].r);
 }
 return chosen;
}

export const moods={
 疲惫:{line:'今天少洗一只锅，也算照顾好了自己。',kind:'quick'},
 烦躁:{line:'先给自己盛一小碗，火候交给计时器。',kind:'fresh'},
 '低落 / emo':{line:'今晚不必张罗一桌，吃到熟悉的那口就好。',kind:'warm'},
 开心:{line:'把喜欢的那道盛进好看的盘子里。',kind:'celebrate'},
 压力大:{line:'把眼前的事缩小一点，先只做这一道菜。',kind:'simple'}
} as const;
export type Mood=keyof typeof moods;
export function moodMenu(mood:Mood,prefs:Preferences,conditions:NutritionCondition[],toolsFit:(r:Recipe)=>boolean=()=>true,catalog:Recipe[]=recipes){
 const kind=moods[mood].kind;
 return catalog.filter(r=>!r.alcohol&&matchesPrefs(r,prefs)&&toolsFit(r)).flatMap(r=>{
   const health=assessNutrition(r,conditions);if(!health.eligible)return [];
   const easy=r.difficulty==='简单',quick=r.time<=25,soup=/汤|粥|羹|炖/.test(r.title),fresh=r.tastes.some(t=>/清|酸|鲜/.test(t)),festive=r.festivals.length>0||/甜品|烘焙/.test(r.category);
   const traits=kind==='quick'?(quick?8:0)+(easy?4:0):kind==='fresh'?(fresh?9:0)+(quick?2:0):kind==='warm'?(soup?10:0)+(easy?2:0):kind==='celebrate'?(festive?9:0)+(r.color==='red'?2:0):(easy?6:0)+(r.steps.length<=4?5:0)+(quick?2:0);
   const favorite=prefs.tastes?.find(t=>tasteFits(r,t));
   const reason=kind==='quick'?'这道菜约 '+r.time+' 分钟能上桌，'+(easy?'做法简单，累的时候也好安排。':'按步骤慢慢做就好。'):
     kind==='fresh'?'这一口偏'+r.tastes.slice(0,2).join('、')+'，换个味道，给忙乱的一天留点空当。':
     kind==='warm'?(soup?'热乎乎地盛上一碗，':'从熟悉的'+r.luckyIngredient+'开始，')+'今晚的饭可以慢慢吃。':
     kind==='celebrate'?(festive?'这道菜有点庆祝的仪式感，':'用'+r.luckyIngredient+'给餐桌添一抹颜色，')+'适合把今天的好心情分一份。':
     '整道菜分 '+r.steps.length+' 步，约 '+r.time+' 分钟。跟着一道做，省去临时想下一步的力气。';
   return [{r,reason:reason+(favorite?' 也合你偏爱的'+favorite+'口味。':''),score:traits+Math.min(3,Math.max(-3,health.score))+(favorite?4:0)}];
 }).sort((a,b)=>b.score-a.score||a.r.time-b.r.time);
}
