'use client';
import {useEffect,useState} from 'react';
import {MessageCircle,NotebookPen} from 'lucide-react';
import type {Recipe} from '@/lib/recipes';
import {ingredientInfo} from '@/lib/planner/cost';
import {pitfallsFor} from '@/lib/planner/coach';
import {pitfallTopics,type PitfallTopic} from '@/lib/planner/topics';
type Report={counts:{topic:PitfallTopic;n:number}[];contributors:number;mine:PitfallTopic[];canSubmit:boolean};
export function DishPicker({pool,id,onChange}:{pool:Recipe[];id:string;onChange:(id:string)=>void}){
 const [query,setQuery]=useState('');const found=pool.filter(r=>[r.title,...r.aliases].join(' ').includes(query.trim()));
 return <div className="desk-fields"><label>找一道菜<input placeholder="输入菜名或别名" value={query} onChange={e=>{const q=e.target.value;setQuery(q);const first=pool.find(r=>[r.title,...r.aliases].join(' ').includes(q.trim()));onChange(first?.id||'')}}/></label><label>选择菜谱<select value={found.some(r=>r.id===id)?id:''} onChange={e=>onChange(e.target.value)}>{!found.length&&<option value="">没有匹配的菜</option>}{found.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label></div>
}
export function PitfallNotes({recipe,restricted=false}:{recipe:Recipe;restricted?:boolean}){
 const hints=pitfallsFor(recipe),[report,setReport]=useState<Report|null>(null),[draft,setDraft]=useState<PitfallTopic[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const c=new AbortController();setReport(null);setDraft([]);setError('');
 fetch('/api/pitfalls?recipe='+encodeURIComponent(recipe.id),{signal:c.signal}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Report>}).then(v=>{if(!c.signal.aborted){setReport(v);setDraft(v.mine)}}).catch(()=>{if(!c.signal.aborted)setError('暂时未能加载饭友反馈。')});return()=>c.abort()},[recipe.id,refresh]);
 async function submit(){
   setBusy(true);setError('');
   try{const r=await fetch('/api/pitfalls',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({recipe:recipe.id,topics:draft})});if(!r.ok)throw Error('反馈保存失败，请稍后重试。');const v:Report=await r.json();setReport(v);setDraft(v.mine)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <div className="pitfall-notes"><p className="desk-kicker">{recipe.time>=90?'耗时很长':recipe.difficulty==='进阶'?'容易翻车':'新手友好'} · {recipe.time} 分钟</p>
 <h4>硬性难点</h4>{hints.hardPoints.map((p,i)=><p key={i}>第 {p.step} 步 · {p.text}</p>)}
 <h4>火候与操作怎么调</h4>{hints.minorIssues.map((p,i)=><p key={i}>{p.text} {hints.improvements[i]?.text}</p>)}
 <p><b>可忽略的小问题</b>　熟度符合菜谱后，装盘不够整齐、分量略有大小差别，都可以放心开饭。</p>
 <p>可替代食材：{restricted?'当前有饮食限制，建议从已筛选的菜谱中另选做法。':recipe.ingredients.map(i=>ingredientInfo(i.name)).filter(i=>i.substitutes.length).slice(0,1).map(i=>i.name+'可用'+i.substitutes[0]).join('')||'这道菜暂未核实可等量替换的食材。'} 替换前请核对个人忌口。</p>
 <p>{hints.suitableFor.join('、')}。{hints.source}</p>
 <section className="desk-aside"><h4><MessageCircle size={17}/>做过这道菜的人怎么说</h4>
 {report?report.contributors>0?<><p>{report.contributors} 位饭友提交过，按实际反馈人数排序。</p>{report.counts.map(c=><p key={c.topic}><b>{pitfallTopics[c.topic].label}</b> · {c.n} 人{c.n>=3&&c.n/report.contributors>=.3?' · 较常遇到':''}。{pitfallTopics[c.topic].tip}</p>)}</>:<p>还没有饭友提交踩坑记录。上方提示来自菜谱步骤。</p>:!error&&<p>正在读取反馈…</p>}
 {report?.canSubmit&&<><p>我实际遇到过</p><div className="desk-chips">{(Object.keys(pitfallTopics) as PitfallTopic[]).map(t=><button key={t} aria-pressed={draft.includes(t)} onClick={()=>setDraft(draft.includes(t)?draft.filter(k=>k!==t):[...draft,t])}>{pitfallTopics[t].label}</button>)}</div><button className="desk-button" disabled={busy||draft.slice().sort().join()===report.mine.slice().sort().join()} onClick={submit}>{draft.length?'保存我的反馈':'撤回我的反馈'}</button></>}
 {error&&<p role="alert">{error} <button onClick={()=>setRefresh(n=>n+1)}>重新加载</button></p>}</section></div>
}
export function RecipePitfalls({recipe,restricted}:{recipe:Recipe;restricted:boolean}){
 const [on,setOn]=useState(false);
 return <details className="desk-detail" onToggle={e=>setOn(e.currentTarget.open)}><summary><NotebookPen size={16}/> 复刻难度与踩坑笔记</summary>{on&&<PitfallNotes recipe={recipe} restricted={restricted}/>}</details>
}
