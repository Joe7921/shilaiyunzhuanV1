'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ClipboardPaste,Dices,HeartHandshake,MessageCircleHeart,Pencil,Plus,Trash2,Users} from 'lucide-react';
import type {Preferences} from '@/lib/client';
import type {Recipe} from '@/lib/recipes';
import {decodeCard,encodeCard,newGuest,tableFor,type Guest} from '@/lib/table';
import {CopyText,GuestForm} from './guest';
import {MatchResult,TeamWheel} from './results';
import {MoodKitchen} from './mood';
export const tableLinks=[{id:'match',title:'美食默契大考验',icon:HeartHandshake},{id:'wheel',title:'点菜轮盘组队版',icon:Dices},{id:'mood',title:'美食情绪处方',icon:MessageCircleHeart}] as const;
type Tab=typeof tableLinks[number]['id']|'card';
function getTab():Tab{const t=window.location.hash.split('/')[1];return t==='wheel'||t==='mood'||t==='card'?t:'match'}
function fromPrefs(p:Preferences):Guest{return {...newGuest(),tastes:[...(p.tastes||[])],allergens:[...p.excluded],avoid:[...(p.avoid||[])],habits:p.vegetarian?['蛋奶素']:[]}}
export default function TablePage({prefs,identity,open,onPrefs}:{prefs:Preferences;identity:string;open:(r:Recipe)=>void;onPrefs:()=>void}){
 const [tab,setTab]=useState<Tab>('match'),[guests,setGuests]=useState<Guest[]>([]),[ready,setReady]=useState(false);
 const [editing,setEditing]=useState<number|null>(null),[draft,setDraft]=useState<Guest>(newGuest),[result,setResult]=useState(false);
 const [share,setShare]=useState(false),[importText,setImportText]=useState(''),[message,setMessage]=useState(''),[card,setCard]=useState<Guest|null>(null),[origin,setOrigin]=useState('');
 const anchor=useRef<HTMLDivElement>(null);
 const storage='sl-table-session-'+identity;
 useEffect(()=>{const route=()=>{setTab(getTab());setResult(false);setEditing(null);setMessage('')};route();setOrigin(window.location.origin+window.location.pathname);window.addEventListener('hashchange',route);return()=>window.removeEventListener('hashchange',route)},[]);
 useEffect(()=>{let roster:Guest[]=[];try{const r=JSON.parse(sessionStorage.getItem(storage)||'[]');if(Array.isArray(r))roster=r.map(x=>typeof x==='string'?decodeCard(x):null).filter((x):x is Guest=>!!x);}catch{}
 setGuests(roster);setEditing(null);setResult(false);setReady(true);
 },[storage]);
 function persist(g:Guest[]){setGuests(g);setResult(false);try{sessionStorage.setItem(storage,JSON.stringify(g.map(encodeCard)))}catch{}}
 function save(p:Guest,index:number){if(guests.some((g,i)=>g.name===p.name&&i!==index))return '桌上已有这个昵称，换一个便于区分。';
   const next=[...guests];next[index]=p;persist(next);setEditing(null);setMessage('已把'+p.name+'的口味记在这桌。');return '';
 }
 const table=useMemo(()=>tableFor(guests),[guests]);
 function edit(i:number){setResult(false);setDraft(guests[i]||(!guests.length?fromPrefs(prefs):newGuest()));setEditing(i);setMessage('')}
 function reveal(){setResult(true);requestAnimationFrame(()=>anchor.current?.scrollIntoView({block:'start',behavior:'instant'}))}
 return <div className="table-page page-content"><header className="table-hero"><div><p className="table-stamp"><Users size={17}/> 食来运转</p><h1>饭搭子小馆</h1><p>找出合拍的口味，一起定下这顿饭。</p></div><img src="/images/brand/picnic-mark.webp" alt="" width="104" height="104"/></header>
 <nav className="table-tabs" aria-label="饭搭子玩法">{tableLinks.map(({id,title,icon:Icon})=><a href={'#table/'+id} aria-current={tab===id?'page':undefined} key={id}><Icon size={18}/>{title}</a>)}</nav>
 {tab==='mood'?<MoodKitchen prefs={prefs} identity={identity} open={open} onPrefs={onPrefs}/>:tab==='card'?<section className="table-panel taste-reply"><h2>给朋友的口味卡</h2><p>只填你愿意告诉这桌朋友的内容。生成后，复制给组桌的人即可。</p><GuestForm key={identity} initial={fromPrefs(prefs)} personal save={p=>{setCard(p);return ''}}/>{card&&<div className="reply-preview"><pre>{encodeCard(card)}</pre><CopyText value={encodeCard(card)} label="复制我的口味卡"/></div>}</section>:<div className="group-spread">
 <section className="table-panel"><h2><Users size={21}/> 这桌有谁</h2><p className="table-sub">两人就能开桌。可以轮流填写，也可以让朋友发来口味卡。</p>
 {guests.length>0&&<ol className="guest-list">{guests.map((g,i)=><li key={i}><div><strong>{g.name}</strong><small>{[...g.tastes,...g.favorites].slice(0,4).join('、')||'口味不限'}</small></div><button aria-label={'编辑'+g.name} onClick={()=>edit(i)}><Pencil size={16}/></button><button aria-label={'移除'+g.name} onClick={()=>{persist(guests.filter((_,n)=>n!==i));setEditing(null);setMessage('已移出本桌')}}><Trash2 size={16}/></button></li>)}</ol>}
 {editing!==null?<GuestForm key={editing} initial={draft} save={p=>save(p,editing)} cancel={()=>setEditing(null)}/>:<div className="table-actions"><button className="flat-button" disabled={!ready} onClick={()=>edit(guests.length)}><Plus size={16}/>添加饭搭子</button><button className="text-button" onClick={()=>{setShare(!share);setMessage('')}}><ClipboardPaste size={15}/>收集好友口味卡</button></div>}
 {share&&<div className="table-invite"><h3>让朋友自己填</h3><p>把入口发给朋友，对方填好后把口味卡发回来。昵称与偏好只在这次会话中暂存。</p><CopyText value={'一起吃什么？到 '+origin+'#table/card 填一张口味卡，复制回来给我。'} label="复制邀请入口"/><label>粘贴朋友发来的口味卡<textarea className="field" aria-label="朋友的口味卡" value={importText} maxLength={8000} onChange={e=>setImportText(e.target.value)}/></label><button className="flat-button" onClick={()=>{const p=decodeCard(importText);if(!p){setMessage('没有读懂这张卡，请粘贴从标题到习惯的完整口味卡。');return}const err=save(p,guests.length);if(err)setMessage(err);else setImportText('')}}>加入这位朋友</button><a href="#table/card">填写我自己的口味卡</a></div>}
 {message&&<p role="status" className="table-sub">{message}</p>}
 </section><div className="result-area" ref={anchor}>{!result||editing!==null?<section className="table-start"><div className="table-medal">{tab==='wheel'?<Dices size={38}/>:<HeartHandshake size={38}/>}</div><h2>{tab==='wheel'?'全桌一起转':'测测点菜默契'}</h2><p>{tab==='wheel'?'先避开每个人不吃的食材，再让轮盘决定。':'从共同爱吃的菜、口味和习惯，看看这一桌有多合拍。'}</p><button className="primary-button" disabled={guests.length<2||editing!==null} onClick={reveal}>{tab==='wheel'?'生成组队转盘':'生成默契鉴定单'}</button><small>{guests.length<2?'还需要 '+(2-guests.length)+' 位饭搭子':'已入席 '+guests.length+' 人'}</small></section>:tab==='wheel'?<TeamWheel table={table} open={open}/>:<MatchResult table={table} open={open}/>}</div></div>}
 </div>;
}
