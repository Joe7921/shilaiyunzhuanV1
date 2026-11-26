'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {BookOpen,CakeSlice,ChefHat,ChevronDown,Gift,SlidersHorizontal,Sparkles} from 'lucide-react';
import {boxPool,openBox} from '@/lib/blindbox';
import type {Recipe} from '@/lib/recipes';
import {FoodImage} from './ui';
export default function BlindBox({dessert,candidates,open,onPrefs}:{dessert:boolean;candidates:Recipe[];open:(r:Recipe)=>void;onPrefs:()=>void}){
 const [quick,setQuick]=useState(false),[noOven,setNoOven]=useState(false);
 const pool=useMemo(()=>boxPool(candidates,dessert,quick,noOven),[candidates,dessert,quick,noOven]);
 return <section className="box-page page-content"><header className="box-hero"><img src="/images/brand/dessert-tea.webp" alt="圆眼橘猫和小鸭在甜品台前打开缎带礼盒"/><div><p className="table-stamp"><Gift size={17}/> 食来运转</p><h1>{dessert?'甜品盲盒':'美食盲盒'}</h1><p>{dessert?'给今天留一口甜的。':'下一餐，揭晓一道家常好味。'}</p></div></header><nav className="box-tabs" aria-label="选择盲盒"><a href="#blindbox" aria-current={!dessert?'page':undefined}><ChefHat size={18}/>美食盲盒</a><a href="#dessert" aria-current={dessert?'page':undefined}><CakeSlice size={18}/>甜品盲盒</a></nav>
 <div className="box-filters"><button aria-pressed={quick} onClick={()=>setQuick(!quick)}>30 分钟内</button><button aria-pressed={noOven} onClick={()=>setNoOven(!noOven)}>不用烤箱</button><button onClick={onPrefs}><SlidersHorizontal size={15}/>我的忌口</button></div>
 <BoxDraw key={pool.map(r=>r.id).join('|')+dessert} pool={pool} dessert={dessert} open={open}/>
 {pool.length>0&&<details className="box-shelf"><summary>看看盒里有哪些{dessert?'甜品':'菜'}（{pool.length}） <ChevronDown size={16}/></summary><div>{pool.map(r=><button key={r.id} onClick={()=>open(r)}>{r.title}</button>)}</div></details>}</section>
}
function BoxDraw({pool,dessert,open}:{pool:Recipe[];dessert:boolean;open:(r:Recipe)=>void}){
 const [seen,setSeen]=useState<string[]>([]),[reveal,setReveal]=useState<Recipe|null>(null),[busy,setBusy]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);useEffect(()=>()=>clearTimeout(timer.current),[]);
 function draw(){if(busy)return;const result=openBox(pool,seen,reveal?.id);if(!result)return;setBusy(true);const ms=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:500;
 timer.current=setTimeout(()=>{setSeen(result.seen);setReveal(result.recipe);setBusy(false)},ms)}
 if(!pool.length)return <div className="table-empty">这盒暂时没有符合当前条件的{dessert?'甜品':'菜谱'}。可以切换用时或厨具条件。</div>;
 return <article className={'box-draw'+(busy?' box-opening':'')}><div className="dessert-preview">{reveal?<FoodImage recipe={reveal}/>:<img src="/images/brand/dessert-mark.webp" alt="橘猫捧着待揭晓的礼盒"/>}</div><div className="box-caption" aria-live="polite"><p className="table-stamp"><Sparkles size={15}/> {reveal?'本次开盒':'待揭晓'}</p><h2>{reveal?reveal.title:dessert?'今天会抽到哪份甜？':'今晚的菜单藏在盒子里'}</h2><p>{reveal?reveal.description:'从符合你饮食偏好的 '+pool.length+' 道中随机抽取，本轮抽完前不会重复。'}</p>{reveal&&<small>{reveal.time} 分钟 · {reveal.difficulty} · {reveal.tastes.join('、')}</small>}<div className="table-actions"><button disabled={busy} className="primary-button" onClick={draw}><Gift size={17}/>{busy?'正在拆盒':reveal?'再开一盒':dessert?'拆开甜品盲盒':'拆开美食盲盒'}</button>{reveal&&<button className="flat-button" onClick={()=>open(reveal)}><BookOpen size={16}/>查看完整做法</button>}</div></div></article>
}
