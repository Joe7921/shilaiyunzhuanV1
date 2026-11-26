import {Cherry,Croissant,CupSoda,Sandwich,Salad,Soup,CookingPot,Utensils,IceCreamBowl,EggFried} from 'lucide-react';
import type {Recipe} from '@/lib/recipes';

export function FoodIcon({recipe,size=22,x=0,y=0}:{recipe?:Recipe;size?:number;x?:number;y?:number}){
  const kind=recipe?.category||'';
  const Icon=kind==='饮品'?CupSoda:kind==='凉菜'?Salad:kind==='烘焙'?Croissant:kind==='甜品'||kind==='糖水'?IceCreamBowl:kind.includes('早餐')?EggFried:kind==='汤羹'?Soup:kind==='热菜'?CookingPot:kind==='小吃'?Sandwich:kind==='主食'?Utensils:Cherry;
  return <Icon size={size} x={x} y={y} strokeWidth={1.7} aria-hidden="true"/>;
}

const signPaths=[
  'M3 8q3-5 5 0l2 8q2-12 5-11c5 1-1 14-3 14m3-5c6-2 7 5 3 5-2 0-3-1-4-2',
  'm2 9 4-3 3 3 4-3 3 3 5-3M2 16l4-3 3 3 4-3 3 3 5-3',
  'M5 3q11 9 0 18M19 3q-11 9 0 18M6 12h12',
  'M12 20V10C12 1 2 2 4 8q1 3 4 2M12 11c0-10 10-9 8-3q-1 3-4 2',
  'M5 3q1 5 7 5t7-5M18 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0',
  'M5 3q7 3 14 0M5 21q7-3 14 0M8 5v14M16 5v14',
  'M3 9q7-9 17-3M11 9a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M21 15q-7 9-17 3M20 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
  'M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 13C1 0 17 0 16 8c0 4-6 10-2 12q3 2 6-3',
  'M2 6q3-4 4 1v10M6 9q4-8 5-2v10M11 9q3-8 5-2v10q0 3 5 4M16 9q7-6 4 4-1 4-6 7',
  'M3 17h7v-2a5 5 0 1 1 4 0v2h7M3 21h18',
  'M2 6q3-4 4 1v9M6 9q4-8 5-2v9M11 9q3-8 5-2v8q0 4 5 3m-3-2 3 2-2 3',
  'M3 21 20 4M12 4h8v8M5 11l8 8'
];
export function ZodiacIcon({index}:{index:number}){
 return <svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={signPaths[index]}/></svg>;
}

