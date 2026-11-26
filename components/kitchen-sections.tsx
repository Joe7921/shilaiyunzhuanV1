'use client';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {Sparkles,CalendarDays,Dices,BookOpen,ChefHat,Soup,SlidersHorizontal,Search,Star,Heart,Users,Flower2,ScrollText} from 'lucide-react';
import type {Recipe} from '@/lib/recipes';
import {recipes} from '@/lib/recipes';
import {calendarYear,upcomingEvents,CALENDAR_SOURCE,CALENDAR_YEARS} from '@/lib/calendar/calendar.mjs';
import {Empty,FoodImage} from './ui';
import PalaceKitchen from './palace-kitchen';

export type Page='planner'|'home'|'magic'|'recipes'|'season'|'calendar'|'book'|'community';
export type Tool='fortune'|'wheel'|'personality'|'poll'|'preferences';
type CardProps={pool:Recipe[];renderCard:(r:Recipe)=>ReactNode};
type Occasion={id:string;name:string;date:string;kind:string;menu:string[];theme:string;isFestival:boolean;daysUntil?:number};
function forEvent(e:Occasion,pool:Recipe[]){
  return pool.filter(r=>r.festivals.includes(e.name)||e.menu.some(name=>[r.title,...r.aliases].includes(name)));
}
export function Home({day,birthday,pool,renderCard,go,tool,onOpen}:{day:string;birthday?:string;go:(p:Page)=>void;tool:(t:Tool)=>void;onOpen:(r:Recipe)=>void}&CardProps){
  const [showTerm,setShowTerm]=useState(false);
  useEffect(()=>{try{setShowTerm(localStorage.getItem('sl-desk-seasonal')==='yes')}catch{}},[]);
  const thisTerm=showTerm&&day?calendarYear(Number(day.slice(0,4))).filter(e=>e.kind==='term'&&e.date<=day).at(-1):null;
  const near:Occasion|undefined=day?upcomingEvents(day,birthday,1)[0]:undefined;
  const seasonal=pool.filter(r=>r.series&&!r.alcohol&&r.category==='汤羹');
  const feature=(near&&forEvent(near,pool).find(r=>!r.alcohol))||pool[0];
  const [filter,setFilter]=useState('编辑精选');
  const featured=useMemo(()=>{
    const picks=['tomato-eggs','pan-seared-salmon','teriyaki-chicken','mapo-tofu'];
    if(filter==='编辑精选')return [...picks.map(id=>pool.find(r=>r.id===id)).filter((r):r is Recipe=>!!r),...pool.filter(r=>!picks.includes(r.id)&&!r.alcohol)].slice(0,4);
    return pool.filter(r=>filter==='半小时开饭'?r.time<=30:filter==='一碗热汤'?/汤羹|汤品/.test(r.category):/甜品|糖水|甜点/.test(r.category)).slice(0,4);
  },[filter,pool]);
  return <div className="journal page-content">
    <PalaceKitchen day={day} recipes={()=>go('recipes')} fortune={()=>go('magic')}/>
    <div className="discovery-strip">{[{label:'美食大转盘',desc:'转出一桌好味',icon:Dices,act:()=>tool('wheel')},{label:'四季食养馆',desc:'汤水与暖饮',icon:Soup,act:()=>go('season')},{label:'节日限定菜单',desc:near?near.name+' · '+near.date.slice(5):'全年食历',icon:CalendarDays,act:()=>go('calendar')},{label:'好友帮选',desc:'请饭搭子投一票',icon:Users,act:()=>tool('poll')}].map(({label,desc,icon:Icon,act})=><button onClick={act} key={label}><i><Icon size={24}/></i><span><b>{label}</b><small>{desc}</small></span></button>)}</div>
    <div className="home-planner"><div><p className="overline"><ChefHat size={16}/> 我的厨房工具</p><h2>厨房计划室</h2></div><div><a href="#planner/pantry">用冰箱配菜</a><a href="#planner/diet">安排三餐</a><a href="#planner/party">搭一桌家宴</a><a href="#planner">全部工具</a></div></div>
    {thisTerm&&<a className="home-term-note" href="#planner/seasonal"><Flower2 size={16}/>{thisTerm.name}到了，看看本期菜篮子</a>}
    <section className="editor-picks"><div className="sectitle"><div><p className="overline"><ChefHat size={15}/> 厨房手记</p><h2>今天端上桌</h2></div><button className="flat-button" onClick={()=>go('recipes')}>浏览全部 {recipes.length} 道 <BookOpen size={16}/></button></div><div className="paper-tabs">{['编辑精选','半小时开饭','一碗热汤','饭后甜点'].map(f=><button className={filter===f?'active':''} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    {featured.length?<div className="recipe-grid">{featured.map(renderCard)}</div>:<Empty title="这个栏目暂时没有匹配的菜" text="可以看看其他分类，或调整选菜偏好。"/>}</section>
    <div className="paper-spread">{seasonal[0]&&<button onClick={()=>go('season')}><FoodImage recipe={seasonal[0]}/><span><small>四季食养馆</small><b>给自己煲一锅汤</b></span></button>}{feature&&near&&<button onClick={()=>go('calendar')}><FoodImage recipe={feature}/><span><small>{near.date.slice(5)} · {near.name}</small><b>{feature.title}</b></span></button>}</div>
    <section className="other-tools"><h2>饭后玩一会儿</h2><div><button onClick={()=>tool('fortune')}><ScrollText/>今日美食抽签</button><button onClick={()=>tool('personality')}><Flower2/>五题美食人格</button><button onClick={()=>go('community')}><Users/>逛逛小饭圈</button><button onClick={()=>tool('preferences')}><SlidersHorizontal/>我的选菜偏好</button></div></section>
  </div>;
}
function matchesSearch(r:Recipe,s:string){
  return [r.title,...r.aliases,r.cuisine,r.category,...r.tags,...r.tastes,...r.ingredients.map(i=>i.name)].some(v=>v.toLowerCase().includes(s.trim().toLowerCase()));
}
export function Catalogue({pool,renderCard,onPrefs,seasonal=false}:CardProps&{onPrefs:()=>void;seasonal?:boolean}){
  const [q,setQ]=useState(''),[group,setGroup]=useState('全部'),[cuisine,setCuisine]=useState('全部'),[limit,setLimit]=useState(24);
  const source=useMemo(()=>seasonal?recipes.filter(r=>r.series):recipes,[seasonal]);
  const list=useMemo(()=>pool.filter(r=>(!seasonal||r.series)&&(group==='全部'||(seasonal?r.series===group:r.category===group||r.tags.includes(group)))&&(cuisine==='全部'||r.cuisine===cuisine)&&matchesSearch(r,q)),[pool,q,group,cuisine,seasonal]);
  const groups=Array.from(new Set(source.map(r=>seasonal?r.series!:r.category)));
  const cuisines=Array.from(new Set(source.map(r=>r.cuisine))).sort((a,b)=>a.localeCompare(b,'zh-CN'));
  useEffect(()=>setLimit(24),[group,cuisine,q]);
  return <div className={'page-content collection '+(seasonal?'seasonal':'')}><header className="collection-heading"><div><p className="overline">{seasonal?<Soup size={16}/>:<BookOpen size={16}/>} {seasonal?'时令汤水手册':'食来运转食谱集'}</p><h1>{seasonal?'四季食养馆':'环球菜谱库'}</h1><p>{seasonal?'从一碗清润糖水，到冬夜的香料热饮。按季节与口味，挑一锅慢慢煮。':'搜一道菜、选一种菜系，或从手边的食材开始。'}</p></div>{seasonal&&source[0]&&<FoodImage recipe={source[0]}/>}</header>
    <div className="collection-controls"><label className="search-field"><Search size={18}/><input id="recipe-search" aria-label="搜索菜名或食材" placeholder={seasonal?'搜索汤水或食材，如雪梨':'搜索菜名、别名或食材'} value={q} onChange={e=>setQ(e.target.value)}/></label>{!seasonal&&<label className="select-wrap"><span>菜系</span><select aria-label="选择菜系" value={cuisine} onChange={e=>setCuisine(e.target.value)}><option>全部</option>{cuisines.map(c=><option key={c}>{c}</option>)}</select></label>}<button className="flat-button" onClick={onPrefs}><SlidersHorizontal size={16}/>选菜偏好</button></div>
    <div className="paper-tabs scroll-tabs">{['全部',...groups,...(seasonal?[]:['快手菜','一人食','轻负担'])].filter((x,i,a)=>a.indexOf(x)===i).map(g=><button key={g} onClick={()=>setGroup(g)} className={g===group?'active':''}>{g}</button>)}</div>
    <p className="result-count">共 {list.length} 道{seasonal?'汤水与饮品':'菜谱'}</p>{list.length?<div className="recipe-grid">{list.slice(0,limit).map(renderCard)}</div>:<Empty title="暂时没有匹配的菜谱" text="可以换个关键词或分类。"><button className="flat-button" onClick={()=>{setQ('');setGroup('全部');setCuisine('全部')}}>清空搜索与分类</button></Empty>}
    {list.length>limit&&<button className="load-more secondary-button" onClick={()=>setLimit(n=>n+24)}>再看 {Math.min(list.length-limit,24)} 道</button>}</div>;
}
export function FoodCalendar({day,birthday,pool,renderCard}:{day:string;birthday?:string}&CardProps){
  const upcoming=day?upcomingEvents(day,birthday,4):[];
  const [chosen,setChosen]=useState(''),[manualYear,setYear]=useState<number|null>(null);
  const year=manualYear||Number(day.slice(0,4))||2026;
  const entries:Occasion[]=calendarYear(year,birthday);
  const active=entries.find(e=>e.id===(chosen||upcoming[0]?.id))||entries[0];
  const selected=active?forEvent(active,pool):[];
  return <div className="page-content collection calendar"><p className="overline"><CalendarDays size={16}/> 四时有味</p><h1>节日限定菜单</h1><div className="upcoming">{upcoming.map(e=><button key={e.date+e.id} onClick={()=>{setYear(Number(e.date.slice(0,4)));setChosen(e.id)}}><small>{e.daysUntil===0?'就在今天':e.daysUntil+' 天后'} · {e.date.slice(5)}</small><b>{e.name}</b></button>)}</div>
  <div className="collection-controls"><label className="select-wrap">年份<select aria-label="浏览年份" value={year} onChange={e=>{setYear(Number(e.target.value));setChosen('new-year')}}>{CALENDAR_YEARS.map(y=><option key={y}>{y}</option>)}</select></label><label className="select-wrap">全年节日与节气<select aria-label="选择节日与节气" value={active?.id||''} onChange={e=>setChosen(e.target.value)}>{entries.map(e=><option key={e.id} value={e.id}>{e.date.slice(5)}　{e.name}</option>)}</select></label></div>
  {active&&<section className={'festival-panel theme-'+active.theme}><div><small>{active.kind==='term'?'二十四节气':'节日食历'} · {active.date}</small><h2>{active.name}吃什么</h2><p>{active.menu.join(' / ')}</p></div>{selected[0]&&<FoodImage recipe={selected[0]}/>}</section>}
  {selected.length?<div className="recipe-grid">{selected.map(renderCard)}</div>:<Empty title="当期菜单暂无符合偏好的菜" text="可以浏览另一个节日，或调整选菜偏好。"/>}
  <p className="calendar-source">农历与节气依香港天文台历表，覆盖 {CALENDAR_YEARS[0]}–{CALENDAR_YEARS.at(-1)} 年。生日采用已填写的公历日期。 <a target="_blank" rel="noreferrer" href={CALENDAR_SOURCE}>查看历表来源</a></p></div>;
}

