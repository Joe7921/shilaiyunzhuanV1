import mapping from './mapping.json';
import referenceLinks from './reference-links.json';
import {foods,foodById} from './meal';
import {predict,type Category} from './worker-client';
type LabelMap={label:string;english:string;recipes:string[];approximate:boolean};
const labels:Readonly<Record<string,LabelMap>>=mapping;
export function suggestions(raw:Category[]){
 const ranked=raw.filter(r=>Number.isInteger(r.index)&&r.index>=0&&r.index<2024&&Number.isFinite(r.score)&&r.score>0&&r.score<=1).sort((a,b)=>b.score-a.score);
 const top=ranked[0];
 if(!top||top.index===0||top.score<0.12)return [];
 return ranked.filter(r=>r.index!==0&&r.score>=Math.max(.055,top.score*.18)).slice(0,3).map(r=>{
   const match=labels[String(r.index)];const english=match?.english||r.label;
   const ref=referenceLinks.find(x=>x.index===r.index);
   const title=match?.label||(ref&&!ref.match.includes('variant')?foodById(ref.foodId)?.title:undefined)||english;
   const alternatives=foods.filter(f=>f.unit==='克'&&[f.title,...f.aliases].some(n=>n.toLowerCase()===english.toLowerCase()||n===title));
   return {index:r.index,title,english,approximate:!!match?.approximate||ref?.match==='variant',ids:[...new Set([...(match?.recipes||[]),...(ref?[ref.foodId]:[]),...alternatives.map(f=>f.id)])].filter(id=>!!foodById(id))};
 });
}
export type SuggestedDish=ReturnType<typeof suggestions>[number];
export async function identifyDish(image:HTMLImageElement){
 if(!image.complete||!image.naturalWidth)await image.decode();
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('当前浏览器无法读取照片，可以手动选菜。');
 // Limit extraction to the inputs the model needs and respect the browser's photo orientation.
 const side=Math.min(image.naturalWidth,image.naturalHeight);
 ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,192,192);
 return suggestions(await predict(canvas));
}
