import {useEffect,useMemo,useState} from 'react';
import {BatteryLow,CloudDrizzle,CloudSun,Flame,Heart,SlidersHorizontal,Sun} from 'lucide-react';
import type {Preferences} from '@/lib/client';
import {defaultConstraints,overallPrefs,toolsFit,type Constraints} from '@/lib/planner/local';
import {nutritionConditions,type NutritionCondition} from '@/lib/planner/nutrition';
import {distinct,moods,moodMenu,type Mood} from '@/lib/table';
import type {Recipe} from '@/lib/recipes';
import {FoodImage} from '../ui';
import {Switches} from './guest';
const icons={疲惫:BatteryLow,烦躁:Flame,'低落 / emo':CloudDrizzle,开心:Sun,压力大:CloudSun};
export function MoodKitchen({prefs,identity,open,onPrefs}:{prefs:Preferences;identity:string;open:(r:Recipe)=>void;onPrefs:()=>void}){
 const [c,setC]=useState<Constraints>(defaultConstraints),[mood,setMood]=useState<Mood|null>(null),[offset,setOffset]=useState(0);
 useEffect(()=>{let next=defaultConstraints;
 try{const s=JSON.parse(localStorage.getItem('sl-desk-filters-'+identity)||'null');
 if(s&&['conditions','tools','avoid','tastes'].every(k=>Array.isArray(s[k])&&s[k].every((x:unknown)=>typeof x==='string')))next={...next,...s};}catch{}
 setC(next);setOffset(0);
 },[identity]);
 const combined=useMemo(()=>overallPrefs(prefs,c),[prefs,c]);
 const list=useMemo(()=>mood?moodMenu(mood,combined,c.conditions.filter((x):x is NutritionCondition=>nutritionConditions.includes(x as NutritionCondition)),r=>toolsFit(r,c.tools)):[],[mood,combined,c]);
 const shown=list.length?list.slice(offset%list.length,offset%list.length+3):[];
 const applied=distinct([...combined.excluded,...(combined.avoid||[]),...(combined.vegetarian?['蛋奶素']:[]),...c.conditions,...(combined.tastes||[]),...c.tools,...(combined.maxTime?[combined.maxTime+' 分钟内']:[])]);
 return <section className="mood-kitchen"><h2>现在是什么心情？</h2>
 <div className="mood-choices">{(Object.keys(moods) as Mood[]).map(m=>{const Icon=icons[m];return <button key={m} aria-pressed={mood===m} onClick={()=>{setMood(m);setOffset(0)}}><Icon size={23}/>{m}</button>})}</div>
 <details className="table-pref"><summary><SlidersHorizontal size={16}/> 本次饮食偏好</summary><p>已读取本站饮食偏好及本机记住的计划室条件。{applied.length?'本次采用 '+applied.join('、')+'。':'还没有设置条件。'}</p><Switches items={[...nutritionConditions]} value={c.conditions} onChange={conditions=>{setC({...c,conditions});setOffset(0)}}/><button className="text-button" onClick={onPrefs}>修改过敏、忌口与口味</button></details>
 {mood&&<div className="mood-receipt" aria-live="polite"><p className="table-stamp"><Heart size={17}/> 给今天的你</p><h2>{moods[mood].line}</h2>
 {shown.length?<><div className="mood-recipes">{shown.map(({r,reason})=><article key={r.id}><button className="mood-photo" aria-label={'打开'+r.title+'菜谱'} onClick={()=>open(r)}><FoodImage recipe={r}/></button><div><h3>{r.title}</h3><small>{r.time} 分钟 · {r.difficulty}</small><p>{reason}</p><button className="text-button" onClick={()=>open(r)}>查看完整做法</button></div></article>)}</div>{list.length>3&&<button className="flat-button" onClick={()=>setOffset(v=>(v+3>=list.length?0:v+3))}>换几道合口的</button>}</>:<p>当前条件下没有合适的菜谱。可以查看本次饮食偏好。</p>}</div>}
 </section>;
}
