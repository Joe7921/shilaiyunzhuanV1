'use client';
import {useMemo,useState} from 'react';
import {ChefHat,Flower2,Stars,NotebookPen,Award} from 'lucide-react';
import {calendarYear} from '@/lib/calendar/calendar.mjs';
import {seasonOf} from '@/lib/astro';
import {makeWish,type WishResult} from '@/lib/planner/wish';
import {seasonalGuide,assessNutrition,type NutritionCondition} from '@/lib/planner/nutrition';
import {assessCook,cookLevels,nextChallenge,type CookReport} from '@/lib/planner/coach';
import {predictCookIssue} from '@/lib/planner/cook-model';
import {matchesPrefs,type Preferences} from '@/lib/client';
import type {Recipe} from '@/lib/recipes';
import {money,toolsFit,type Constraints} from '@/lib/planner/local';
import {DishPicker,PitfallNotes} from './pitfalls';
import type {PlannerStore} from './use-planner-data';

export function WishDesk({c,prefs}:{c:Constraints;prefs:Preferences}){
 const [text,setText]=useState(''),[pressed,setPressed]=useState(false);
 const picked=useMemo(()=>pressed?makeWish({text,people:c.people,budget:c.budget,tools:c.tools.map(x=>x==='仅基础餐具'?'无锅':x),avoid:prefs.avoid||[],excludes:prefs.excluded}):null,[pressed,text,c,prefs]);
 const accepts=(r:Recipe)=>matchesPrefs(r,prefs)&&toolsFit(r,c.tools)&&assessNutrition(r,c.conditions as NutritionCondition[]).eligible;
 const safe=picked?.recipes.filter(accepts)||[];
 return <><h2><Stars/>反向许愿菜谱</h2><label>想吃什么，今天有什么限制？<textarea value={text} maxLength={300} onChange={e=>{setText(e.target.value);setPressed(false)}} placeholder="比如：宿舍无锅，想做一道开胃的小吃，不吃玉米"/></label><button className="desk-action" disabled={!text.trim()} onClick={()=>setPressed(true)}>生成我的原创配方</button>
 {picked&&!safe.length&&<p role="status">{picked.gaps.join(' ')||'这组口味、厨具和饮食限制暂时无法组成完整配方。可以换一种口味或厨具。'}</p>}
 {safe.map(r=><section className="wish-paper" key={r.id}><span className="desk-kicker">原创文字配方 · {r.time} 分钟 · {r.difficulty} · 整餐约 {money(r.estimatedCost)}</span><h3>{r.title}</h3><p>{r.description}</p><p>{r.ingredients.map(i=>i.name+' '+i.amount+i.unit).join('、')}</p><ol>{r.steps.map(s=><li key={s}>{s}</li>)}</ol><p>{r.tip}</p>{r.substitutions.filter(s=>!c.conditions.length&&!prefs.excluded.length&&!prefs.avoid?.length||safe.some(x=>x.id===s.recipeId)).slice(0,2).map(s=><details key={s.recipeId}><summary>替换方案 · {s.from}换{s.to}</summary><p>{s.amount}{s.unit}，约 {money(s.estimatedCost)}。</p><ol>{s.steps.map(x=><li key={x}>{x}</li>)}</ol></details>)}</section>)}
 {picked&&<p className="desk-foot">{picked.assumptions.join(' ')}</p>}</>;
}
export function seasonalContext(day:string){
 const year=Number(day.slice(0,4));
 const terms=[...calendarYear(year-1),...calendarYear(year)].filter(e=>e.kind==='term'&&e.date<=day);
 const term=terms.at(-1);const season=seasonOf(day);
 return {season,term,guide:seasonalGuide(season,term?.name)};
}
export function SeasonalDesk({day,pool,open,reminder,onReminder}:{day:string;pool:Recipe[];open:(r:Recipe)=>void;reminder:boolean;onReminder:(b:boolean)=>void}){
 const {season,term,guide}=useMemo(()=>seasonalContext(day),[day]);
 return <><h2><Flower2/>{term?.name||season+'日'}的菜篮子</h2><p>{guide.termNote}</p><label className="desk-inline"><input type="checkbox" checked={reminder} onChange={e=>onReminder(e.target.checked)}/>本机首页显示当期节气提醒</label>
 {guide.foods.map(f=>{const matches=pool.filter(r=>r.seasons.includes(season)&&r.ingredients.some(i=>[f.name,...f.aliases].some(a=>i.name.includes(a))));return <article key={f.name} className="season-item"><h3>{f.name}</h3><p>{f.reason} {f.tradition}</p><p><b>菜场怎么挑</b>　{f.selection}</p><div className="desk-chips">{matches.slice(0,3).map(r=><button key={r.id} onClick={()=>open(r)}>{r.title} · {r.time} 分钟</button>)}</div>{!matches.length&&<p>当前限制下没有合适的这类菜。</p>}</article>})}
 <small>{guide.region}</small></>
}
export function PracticeDesk({pool,store,kind,open,restricted}:{pool:Recipe[];store:PlannerStore;kind:'coach'|'pitfalls';open:(r:Recipe)=>void;restricted:boolean}){
 const [id,setId]=useState(pool[0]?.id||''),[method,setMethod]=useState(''),[outcome,setOutcome]=useState(''),[minutes,setMinutes]=useState(''),[independent,setIndependent]=useState(true),[failed,setFailed]=useState(false),[notice,setNotice]=useState('');
 const [result,setResult]=useState<{report:CookReport;model:ReturnType<typeof predictCookIssue>}|null>(null);
 const dish=pool.find(r=>r.id===id);
 const next=result&&dish?nextChallenge(pool,result.report.progress,dish.id):undefined;
 async function judge(){
   if(!dish||method.trim().length<4||outcome.trim().length<2||Number(minutes)<=0||!Number.isFinite(Number(minutes))){setNotice('请补全做法、成品描述及实际耗时。');return}
   const model=predictCookIssue(method,outcome);
   const report=assessCook({recipe:dish,method,outcome,independent,minutes:Number(minutes),failed:failed||model.label==='夹生'},store.data.cooking[0]);
   setResult({report,model});if(report.credited){const saved=await store.save('cooking',[report.progress]);setNotice(saved?'这道新菜已计入闯关。':'本次进度未保存。')}else setNotice('本次复盘已完成。');
 }
 return <><h2>{kind==='coach'?<ChefHat/>:<NotebookPen/>}{kind==='coach'?'厨艺闯关':'菜谱踩坑笔记'}</h2>{pool.length>0&&<DishPicker pool={pool} id={id} onChange={x=>{setId(x);setResult(null);setMethod('');setOutcome('');setNotice('')}}/>}{!dish?<p>没有匹配的菜，试试另一个菜名或调整条件。</p>:<>{kind==='pitfalls'?<PitfallNotes key={dish.id} recipe={dish} restricted={restricted}/>:<>
 <p className="desk-foot">{cookLevels.map(l=>l.name).join(' → ')} · 已完成 {store.data.cooking[0]?.completed?.length||0} 道不同菜。</p>
 <label>你怎么做的？<textarea value={method} maxLength={1200} onChange={e=>{setMethod(e.target.value);setResult(null)}} placeholder="例如 先炒鸡蛋盛出，再小火把番茄炒出汁"/></label><label>照片里或实物上的成品状态<textarea value={outcome} maxLength={800} onChange={e=>{setOutcome(e.target.value);setResult(null)}} placeholder="写下颜色、质地、熟度或你尝到的味道"/></label>
 <div className="desk-fields"><label>实际用时（分钟）<input type="number" min="1" max="2000" value={minutes} onChange={e=>{setMinutes(e.target.value);setResult(null)}}/></label><label className="desk-inline"><input type="checkbox" checked={failed} onChange={e=>{setFailed(e.target.checked);setResult(null)}}/>这次翻车了</label></div>
 <label className="desk-inline"><input type="checkbox" checked={independent} onChange={e=>{setIndependent(e.target.checked);setResult(null)}}/>这道菜由我独立完成</label><button className="desk-action" disabled={!store.ready||store.busy} onClick={judge}>提交本次闯关</button>{notice&&<p role="status">{notice}</p>}
 {result&&<section className="wish-paper"><p className="desk-kicker">厨艺复盘</p><h3><Award size={21}/> {result.report.levelName} · {result.report.score} 分</h3><p>{result.report.credited?'通关！饭本上又点亮了一道拿手菜。':result.report.progress.completed.some(r=>r.recipeId===dish.id)?'这道菜已留下独立完成记录。':'本次记作练习，下一锅再试。'}</p><p><b>本机文字模型</b>　{result.model.label||'描述不足，暂不判定'}。{result.model.advice}</p><p className="desk-foot">{result.model.basis} 仅处理你填写的文字。</p>
 {result.report.dimensions.map(d=><p key={d.name}><b>{d.name} {d.points}/{d.max}</b>　{d.reason}</p>)}<p>{result.report.advice.join(' ')}</p><p>{result.report.nextLevel}</p>{next&&<p>下一关　<button className="desk-link" onClick={()=>open(next)}>{next.title} · {next.difficulty} · {next.time} 分钟</button></p>}</section>}</>}</>}</>
}
