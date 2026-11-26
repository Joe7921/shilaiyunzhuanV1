'use client';
import {useEffect,useMemo,useState} from 'react';
import {BookOpenCheck,ChefHat,ChevronDown,CircleHelp,Coins,Flower2,NotebookPen,PackageOpen,PartyPopper,SlidersHorizontal,Stars} from 'lucide-react';
import {matchesPrefs,type Preferences,type User} from '@/lib/client';
import {recipes,type Recipe} from '@/lib/recipes';
import {assessNutrition,conditionNotes,nutritionConditions,nutritionSources,type NutritionCondition} from '@/lib/planner/nutrition';
import {defaultConstraints,overallPrefs,sections,tabNames,toolsFit,toolOptions,words,type DeskTab,type Constraints} from '@/lib/planner/local';
import {Pantry} from './pantry';
import {MenuDesk} from './menus';
import {PracticeDesk,SeasonalDesk,WishDesk} from './creative';
import {usePlannerData} from './use-planner-data';

const icons={pantry:PackageOpen,diet:BookOpenCheck,party:PartyPopper,saving:Coins,wish:Stars,seasonal:Flower2,coach:ChefHat,pitfalls:NotebookPen};
export default function PlannerDesk({day,prefs,user,profileLoading,open,onPrefs}:{day:string;prefs:Preferences;user:User|null;profileLoading:boolean;open:(r:Recipe)=>void;onPrefs:()=>void}){
 const [tab,setTab]=useState<DeskTab>('pantry'),[c,setC]=useState<Constraints>(defaultConstraints),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
   const route=()=>{const section=location.hash.split('/')[1] as DeskTab;setTab(sections.includes(section)?section:'pantry')};
   route();window.addEventListener('hashchange',route);return ()=>window.removeEventListener('hashchange',route);
 },[]);
 const [extra,setExtra]=useState(''),[remember,rememberSettings]=useState(false),[reminder,setReminder]=useState(false);
 const store=usePlannerData(user?.id||null,profileLoading);
 const key='sl-desk-filters-'+(user?.id||'guest');
 useEffect(()=>{if(profileLoading)return;setLoaded(false);
   let next=defaultConstraints;let saved=false;try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw&&Array.isArray(raw.conditions)&&Array.isArray(raw.tools)&&Array.isArray(raw.avoid)&&Array.isArray(raw.tastes)){next=raw;saved=true}setReminder(localStorage.getItem('sl-desk-seasonal')==='yes')}catch{}
   setC(next);setExtra(next.avoid.join('，'));rememberSettings(saved);setLoaded(true);
 },[key,profileLoading]);
 useEffect(()=>{if(!loaded||profileLoading)return;try{if(remember)localStorage.setItem(key,JSON.stringify(c));else localStorage.removeItem(key)}catch{}},[remember,c,loaded,key,profileLoading]);
 const combined=useMemo(()=>overallPrefs(prefs,c),[prefs,c]);
 const health=c.conditions.filter((v):v is NutritionCondition=>nutritionConditions.includes(v as NutritionCondition));
 const pool=useMemo(()=>recipes.filter(r=>matchesPrefs(r,combined)&&toolsFit(r,c.tools)).map(r=>({r,s:assessNutrition(r,c.conditions as NutritionCondition[])})).filter(x=>x.s.eligible)
  .sort((a,b)=>b.s.score-a.s.score||Number(b.r.tastes.some(t=>combined.tastes?.includes(t)))-Number(a.r.tastes.some(t=>combined.tastes?.includes(t)))).map(x=>x.r),[combined,c]);
 function toggle(key:'conditions'|'tools'|'tastes',v:string){setC(p=>({...p,[key]:p[key].includes(v)?p[key].filter(x=>x!==v):key==='tools'&&v==='仅基础餐具'?[v]:[...p[key].filter(x=>key!=='tools'||x!=='仅基础餐具'),v]}))}
 function changeTab(t:DeskTab){setTab(t);window.location.hash='planner/'+t}
 function setSeasonReminder(v:boolean){setReminder(v);try{localStorage.setItem('sl-desk-seasonal',v?'yes':'no')}catch{}}
 const dims=c.conditions.filter(x=>nutritionConditions.includes(x as NutritionCondition));
 return <div className="desk-page page-content"><header className="desk-head"><div><p className="overline"><ChefHat size={17}/> 食来运转</p><h1>厨房计划室</h1></div><button className="desk-button" onClick={onPrefs}><SlidersHorizontal size={16}/>过敏与忌口</button></header>
 <nav className="desk-tools" aria-label="厨房工具">{sections.map(t=>{const Icon=icons[t];return <button key={t} aria-pressed={tab===t} onClick={()=>changeTab(t)}><Icon size={19}/>{tabNames[t]}</button>})}</nav>
 <div className="desk-base"><label>用餐人数<input type="number" aria-label="计划用餐人数" min="1" max="30" value={c.people||''} onChange={e=>setC({...c,people:Math.min(30,Math.max(0,Math.floor(Number(e.target.value))))})}/></label><label>本次或本期总预算（元）<input type="number" aria-label="计划总预算（元）" min="0" step=".5" value={c.budget} onChange={e=>setC({...c,budget:Math.max(0,Number(e.target.value))})}/></label><span>{pool.length} 道符合当前条件</span></div>
 <details className="desk-detail desk-conditions"><summary><SlidersHorizontal size={16}/> 口味、身体情况和厨具 <ChevronDown size={15}/></summary>
 <h4>选餐时考虑</h4><div className="desk-chips">{nutritionConditions.map(x=><button key={x} aria-pressed={dims.includes(x)} onClick={()=>toggle('conditions',x)}>{x}</button>)}</div>
 {health.map(h=><p className="desk-foot" key={h}>{conditionNotes[h]} <a href={nutritionSources[h].url} target="_blank" rel="noreferrer">参考依据</a></p>)}
 <h4>我想吃的口味</h4><div className="desk-chips">{['咸鲜','酸甜','蒜香','麻辣','清淡','奶香'].map(x=><button key={x} aria-pressed={c.tastes.includes(x)} onClick={()=>toggle('tastes',x)}>{x}</button>)}</div>
 <label>本次所有人不吃的食材<input value={extra} onChange={e=>{setExtra(e.target.value);setC({...c,avoid:words(e.target.value)})}} placeholder="例如 香菜，花生，牛肉"/></label>
 <h4>可用厨具</h4><p className="desk-foot">未选择表示不限。刀板和碗筷按基础餐具处理。</p><div className="desk-chips">{toolOptions.map(x=><button key={x} aria-pressed={c.tools.includes(x)} onClick={()=>toggle('tools',x)}>{x}</button>)}</div>
 <label className="desk-inline"><input type="checkbox" checked={remember} onChange={e=>rememberSettings(e.target.checked)}/>仅在本机记住以上规划条件</label></details>
 {!c.people?<p role="status">请输入至少 1 位用餐人数。</p>:<section className="desk-panel">
 {store.error&&<p role="alert">{store.error} <button className="desk-link" onClick={store.reload}>重新读取</button></p>}
 {tab==='pantry'&&<Pantry pool={pool} people={c.people} today={day} store={store} open={open} restricted={!!(health.length||combined.vegetarian||combined.excluded.length||combined.avoid?.length)}/>}
 {(tab==='diet'||tab==='party'||tab==='saving')&&<MenuDesk key={tab} kind={tab} conditions={{...c,tastes:combined.tastes||[]}} pool={pool} today={day} store={store} open={open}/>}
 {tab==='wish'&&<WishDesk c={c} prefs={combined}/>}
 {tab==='seasonal'&&<SeasonalDesk day={day} pool={pool} open={open} reminder={reminder} onReminder={setSeasonReminder}/>}
 {(tab==='coach'||tab==='pitfalls')&&<PracticeDesk key={tab} kind={tab} pool={pool} store={store} open={open} restricted={!!(health.length||combined.vegetarian||combined.excluded.length||combined.avoid?.length)}/>}</section>}</div>
}
