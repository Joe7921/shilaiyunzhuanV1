import {recipes} from '../recipes';
import reference from './usda.json';

export type Food = {id:string;title:string;aliases:string[];unit:'人份'|'克';basis:number;energy:number;source?:string;recipeId?:string};
export const foods:Food[]=[
  ...recipes.map(r=>({id:r.id,title:r.title,aliases:r.aliases,unit:'人份' as const,basis:1,energy:r.kcal/r.servings,recipeId:r.id})),
  ...reference.map(r=>({id:r.id,title:r.title,aliases:r.aliases,unit:'克' as const,basis:100,energy:r.kcalPer100g,source:r.source}))
];
const byId=new Map(foods.map(r=>[r.id,r]));
export function foodById(id:string){return byId.get(id)}
export type AmountInput={id:string;amount:number};
export type MealLine=AmountInput & {title:string;unit:Food['unit'];kcal:number};
export type Meal={items:MealLine[];kcal:number};
export function confirmedMeal(input:unknown):Meal{
 if(!Array.isArray(input)||input.length<1||input.length>12)throw Error('请确认 1–12 项实际吃下的食物。');
 const items:MealLine[]=input.map(row=>{
   const food=typeof row?.id==='string'&&foodById(row.id);
   if(!food||typeof row.amount!=='number'||!Number.isFinite(row.amount)||row.amount<=0||row.amount>(food.unit==='克'?5000:20))throw Error('请选择有效食物，并填写合理的正数份量。');
   const amount=Math.round(row.amount*100)/100;
   if(amount<=0)throw Error('份量过小，请重新填写。');
   return {id:food.id,title:food.title,amount,unit:food.unit,kcal:Math.round(food.energy*amount/food.basis)};
 });
 const kcal=items.reduce((sum,row)=>sum+row.kcal,0);
 if(kcal>20000)throw Error('本餐份量超出记录范围，请核对数量和单位。');
 return {items,kcal};
}
