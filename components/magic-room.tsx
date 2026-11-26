'use client';
import { shareUrl } from '@/lib/share-links';
import {useEffect,useMemo,useState} from 'react';
import {Sparkles,Star,History,BookOpen,Plus,Share2,CalendarDays,Check} from 'lucide-react';
import {fortuneFor,zodiac,type Birth,type Reading} from '@/lib/astro';
import type {Recipe} from '@/lib/recipes';
import {ZodiacIcon} from './food-icons';
import {FoodImage} from './ui';

export type PastReading={day:string; sign:string; number:number; color:string; ingredient:string; taste:string; main:string; alternatives:string[]; dessert?:string; drink?:string; reason:string; message:string};
export type Notebook={birth:Birth|null;history:PastReading[];menus:Record<string,string[]>};
export const emptyNotebook:Notebook={birth:null,history:[],menus:{}};
type Props={
 day:string; birth:Birth; onBirth:(b:Birth)=>void; notebook:Notebook; onSave:(n:Notebook)=>void; candidates:Recipe[];
 tastes:string[]; onOpen:(r:Recipe)=>void; onPrefs:()=>void; onToast:(s:string)=>void; ready:boolean;
};
function snapshot(r:Reading):PastReading {
  return {day:r.day,sign:r.sign.name,number:r.number,color:r.color,ingredient:r.ingredient,taste:r.taste,main:r.main.id,alternatives:r.alternatives.map(x=>x.id),dessert:r.dessert?.id,drink:r.drink?.id,reason:r.reason,message:r.message};
}
export default function MagicRoom({day,birth,onBirth,notebook,onSave,candidates,tastes,onOpen,onPrefs,onToast,ready}:Props) {
  const [remember,setRemember]=useState(Boolean(notebook.birth));
  const [phase,setPhase]=useState(0);
  const [showHistory,setShowHistory]=useState(false);
  const [shareCopy,setShareCopy]=useState('');
  const sign=zodiac(birth.date);
  const reading=useMemo(()=>fortuneFor(birth,day,candidates,tastes),[birth,day,candidates,tastes]);
  const signature=[birth.date,birth.time,candidates.map(x=>x.id).join(','),tastes.join(',')].join('|');
  useEffect(()=>{setPhase(0);setShareCopy('')},[signature]);
  useEffect(()=>setRemember(Boolean(notebook.birth)),[notebook.birth]);
  useEffect(()=>{
    if(phase<1 || phase>=5)return;
    const id=setTimeout(()=>setPhase(n=>n+1),window.matchMedia('(prefers-reduced-motion: reduce)').matches?10:420);
    return ()=>clearTimeout(id);
  },[phase]);
  const savedToday=Boolean(reading && notebook.menus[day]?.includes(reading.main.id));
  function begin(e:React.FormEvent){
    e.preventDefault();if(!reading||!ready)return;
    const entry=snapshot(reading);
    const history=[entry,...notebook.history.filter(h=>h.day!==entry.day || h.main!==entry.main || h.sign!==entry.sign || h.number!==entry.number)].slice(0,90);
    onSave({...notebook,birth:remember?birth:null,history});setShowHistory(false);setPhase(1);
  }
  function erase(){
    onBirth({date:'',time:''});setRemember(false);setPhase(0);
    onSave({...notebook,birth:null,history:[]});onToast('已删除本机出生信息和占卜历史');
  }
  async function share(){
    if(!reading)return;
    const url=shareUrl('recipe',reading.main.id);
    const text=reading.sign.name+'的今日美食星运 · '+day+'\n幸运数字 '+reading.number+' · '+reading.color+' · '+reading.ingredient+'\n今天做「'+reading.main.title+'」';
    try {
      if(navigator.share) await navigator.share({title:'我的美食星运',text,url});
      else { await navigator.clipboard.writeText(text+'\n'+url);onToast('星运与菜谱链接已复制'); }
    } catch(e){if((e as Error).name!=='AbortError')setShareCopy(text+'\n'+url)}
  }
  return <section className="magic-room">
    <div className="room-scene"><div><p className="eyeline"><Sparkles size={16}/> 星座美食魔法屋</p><h1>今天，你的星星<br/>想吃什么？</h1><p>跟着猫咪占卜师，翻开你的每日食签。</p></div></div>
    <div className="room-paper"><form className="birth-form" onSubmit={begin}>
      <div className="sectitle"><div><p className="overline">每日食签</p><h2>把生日写给星星</h2></div><button type="button" className="flat-button" onClick={()=>setShowHistory(v=>!v)}><History size={17}/>{showHistory?'收起历史':'查看历史占卜'}</button></div>
      <div className="birth-fields"><label>出生日期<input type="date" value={birth.date} required max={day} onInput={e=>onBirth({...birth,date:e.currentTarget.value})} onChange={e=>onBirth({...birth,date:e.target.value})}/></label><label>出生时间 <small>选填</small><input type="time" value={birth.time} onInput={e=>onBirth({...birth,time:e.currentTarget.value})} onChange={e=>onBirth({...birth,time:e.target.value})}/></label><div className="birth-sign"><b>{sign?<ZodiacIcon index={sign.index}/>:<Sparkles size={22}/>}</b><span>{sign?.name||'等待你的星座'}</span></div></div>
      <div className="birth-controls"><label><input type="checkbox" checked={remember} onChange={e=>{setRemember(e.target.checked);if(!e.target.checked&&notebook.birth)onSave({...notebook,birth:null})}}/> 在此设备记住出生信息</label>{(notebook.birth||birth.date||notebook.history.length>0)&&<button className="flat-button" type="button" onClick={erase}>清除出生信息和历史</button>}</div>
      <div className="launch-line"><button className="magic-button" disabled={!ready||(phase>0&&phase<5)||Boolean(sign&&!reading)}><Sparkles size={18}/>{phase>0&&phase<5?'水晶球正在发光…':phase===5?'再看今日食签':'开始占卜'}</button><button type="button" className="flat-button" onClick={onPrefs}>设置忌口与口味</button></div>
      <p className="fineprint">按你所在地的日期 {day} 抽取，仅供趣味娱乐。出生信息不会随分享发送。</p>
      {sign&&!reading&&<p role="status">当前条件下没有合适的正餐。可以调整做饭用时，或查看已有忌口。</p>}
    </form>
    {showHistory&&<section className="past-readings"><h2>我的星运手账</h2>{notebook.history.length?notebook.history.map((h,i)=>{
      const dish=candidates.find(r=>r.id===h.main);
      return <details key={h.day+h.main+i}><summary>{h.day} · {h.sign} · {dish?.title||'当前忌口已隐藏此菜'}</summary><p>{h.message}</p><p>幸运数字 {h.number} · {h.color} · {h.ingredient} · {h.taste}</p>{dish&&<><p>{h.reason}</p><button className="flat-button" onClick={()=>onOpen(dish)}>打开当日幸运菜</button></>}</details>
    }):<p>抽到第一份食签后，可以在这里回看。</p>}</section>}
    {phase>0 && reading && <section className="star-reading" aria-live="polite"><div className={'reading-orb '+(phase<5?'glow':'')} aria-hidden="true"><Sparkles size={20}/></div><p className="overline">{reading.sign.name} · 今日美食运势</p><h2>{reading.message}</h2><div className="reveal-cards">{[['幸运数字',reading.number],['幸运颜色',reading.color],['幸运食材',reading.ingredient]].map(([k,v],i)=><div className={phase>=i+2?'unveiled':'covered'} key={k}><Star size={14}/><small>{k}</small><strong>{phase>=i+2?v:<Star size={20}/>}</strong></div>)}</div>
    {phase===5&&<><div className="destiny"><FoodImage recipe={reading.main}/><div><p className="overline"><Sparkles size={14}/> 今日命定幸运菜</p><h2>{reading.main.title}</h2><p>幸运口味 · {reading.taste}</p><p>{reading.reason}</p><button className="magic-button" onClick={()=>onOpen(reading.main)}><BookOpen size={17}/>跟着星星去做饭</button></div></div>
    <div className="result-actions"><button className="secondary-button" disabled={savedToday} onClick={()=>{onSave({...notebook,menus:{...notebook.menus,[day]:[...(notebook.menus[day]||[]),reading.main.id]}});onToast('已加入今日菜单，可在我的饭本查看')}}>{savedToday?<Check size={16}/>:<Plus size={16}/>} {savedToday?'已加入今日菜单':'加入今日菜单'}</button><button className="secondary-button" onClick={share}><Share2 size={16}/>分享我的美食星运</button></div>
    {shareCopy&&<textarea aria-label="复制星运分享文字" readOnly value={shareCopy} onFocus={e=>e.target.select()}/>}
    <div className="also-table">{[['备选菜',reading.alternatives],['幸运甜品',reading.dessert?[reading.dessert]:[]],['幸运饮品',reading.drink?[reading.drink]:[]]].map(([label,list])=><div key={label as string}><strong>{label as string}</strong><div>{(list as Recipe[]).length?(list as Recipe[]).map(r=><button className="flat-button" onClick={()=>onOpen(r)} key={r.id}>{r.title}</button>):<span>当前偏好下暂无匹配</span>}</div></div>)}</div></>}</section>}</div></section>;
}

