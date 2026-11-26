import type { Recipe } from '../recipes';
import type {Preferences} from '../client';
export const sections=['pantry','diet','party','saving','wish','seasonal','coach','pitfalls'] as const;
export type DeskTab=typeof sections[number];
export const tabNames:Record<DeskTab,string>={pantry:'冰箱库存',diet:'定制食谱',party:'饭局菜单',saving:'省钱厨房',wish:'反向许愿',seasonal:'时令推荐',coach:'厨艺闯关',pitfalls:'踩坑笔记'};
export type Stock={id:string;name:string;amount:number;unit:string;expires:string};
export type BudgetCycle={id:string;start:string;days:number;budget:number;baseline:number|null};
export type Expense={id:string;date:string;amount:number;note:string};
export type Constraints={people:number;budget:number;conditions:string[];tools:string[];tastes:string[];avoid:string[]};
export const defaultConstraints:Constraints={people:2,budget:80,conditions:[],tools:[],tastes:[],avoid:[]};
export const words=(v:string)=>[...new Set(v.split(/[、，,；;\n]/).map(t=>t.trim()).filter(Boolean))];
export const dateAfter=(day:string,delta:number)=>new Date(Date.parse(day+'T12:00:00Z')+delta*86400000).toISOString().slice(0,10);
export const amountText=(n:number)=>Number(n.toFixed(2));
export const money=(n:number)=>'¥'+n.toFixed(2);
export function availableStock(rows:Stock[],day:string){return rows.filter(i=>!i.expires||i.expires>=day)}
export function periodSummary(expenses:Expense[],start:string,days:number,budget:number,baseline:number|null,today:string){
 const end=dateAfter(start,days-1),records=expenses.filter(r=>r.date>=start&&r.date<=end);
 const actual=Math.round(records.reduce((v,r)=>v+r.amount,0)*100)/100;
 return {end,records,actual,remaining:budget-actual,ended:today>end,saving:baseline===null||!records.length?null:baseline-actual};
}
export function groupedTool(v:string){
 if(/蒸锅|蒸屉|蒸架|蒸笼/.test(v))return '蒸锅';
 if(/微波炉|微波适用/.test(v))return '微波炉';
 if(/烤箱|烤盘|烤模|圆模|烤纸|烘焙纸|烤架|模具/.test(v))return '烤箱';
 if(/空气炸锅/.test(v))return '空气炸锅';
 if(/高压|压力锅/.test(v))return '压力锅';
 if(/电饭/.test(v))return '电饭锅';
 if(/料理机|搅拌机|搅拌杯|果汁机|破壁|榨汁机/.test(v))return '料理机';
 if(/冰箱|冷藏|冰格|冷冻/.test(v))return '冰箱';
 if(/炒锅|铁锅|中式锅/.test(v))return '炒锅';
 if(/平底|煎锅|不粘锅|不黏锅|玉子烧锅/.test(v))return '平底锅';
 if(/砂锅|砂煲|煲仔/.test(v))return '砂锅';
 if(/锅|汤煲|炖盅|热水壶/.test(v))return '煮锅';
 if(/打蛋器/.test(v))return '打蛋器';
 if(/温度计/.test(v))return '食物温度计';
 if(/咖啡壶/.test(v))return '咖啡壶';
 return '基础餐具';
}
export const toolOptions=['仅基础餐具','炒锅','平底锅','煮锅','蒸锅','砂锅','电饭锅','微波炉','烤箱','空气炸锅','压力锅','冰箱','料理机','打蛋器','食物温度计','咖啡壶'];
export const toolsFit=(r:Pick<Recipe,'tools'>,available:string[])=>!available.length||r.tools.every(t=>{const g=groupedTool(t);return g==='基础餐具'||available.includes(g)});
export function overallPrefs(prefs:Preferences,c:Constraints):Preferences{return {...prefs,avoid:[...new Set([...(prefs.avoid||[]),...c.avoid])],tastes:[...new Set([...(prefs.tastes||[]),...c.tastes])]};}
