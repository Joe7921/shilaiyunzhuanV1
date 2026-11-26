'use client';
import {useMemo,useState} from 'react';
import {ChefHat,Flower2,Stars,NotebookPen,Award} from 'lucide-react';
import {seasonalContext,seasonalFoods,traditionalDishes,traditionalGroups,seasonCalendar,type SeasonalGroup} from '@/lib/planner/season';
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
 const picked=useMemo(()=>pressed?makeWish({text,people:c.people,budget:c.budget,tools:c.tools.map(x=>x==='仅基础餐具'?'无锅':x),avoid:prefs.avoid||[],excludes:prefs.excluded},
   r=>matchesPrefs(r,prefs)&&toolsFit(r,c.tools)&&assessNutrition(r,c.conditions as NutritionCondition[]).eligible):null,[pressed,text,c,prefs]);
 const safe=picked?.recipes||[];
 return <><h2><Stars/>反向许愿菜谱</h2><label>想吃什么，今天有什么限制？<textarea value={text} maxLength={300} onChange={e=>{setText(e.target.value);setPressed(false)}} placeholder="比如：宿舍无锅，想做一道开胃的小吃，不吃玉米"/></label><button className="desk-action" disabled={!text.trim()} onClick={()=>setPressed(true)}>生成我的原创配方</button>
 {picked&&!safe.length&&<p role="status">{picked.gaps.join(' ')||'这组口味、厨具和饮食限制暂时无法组成完整配方。可以换一种口味或厨具。'}</p>}
 {safe.map(r=><section className="wish-paper" key={r.id}><span className="desk-kicker">原创文字配方 · {r.time} 分钟 · {r.difficulty} · 整餐约 {money(r.estimatedCost)}</span><h3>{r.title}</h3><p>{r.description}</p><p>{r.ingredients.map(i=>i.name+' '+i.amount+i.unit).join('、')}</p><ol>{r.steps.map(s=><li key={s}>{s}</li>)}</ol><p>{r.tip}</p>{r.substitutions.slice(0,2).map(s=><details key={s.recipeId}><summary>替换方案 · {s.from}换{s.to}</summary><p>{s.amount}{s.unit}，约 {money(s.estimatedCost)}。</p><ol>{s.steps.map(x=><li key={x}>{x}</li>)}</ol></details>)}</section>)}
 {picked&&<p className="desk-foot">{picked.assumptions.join(' ')}</p>}</>;
}
export function SeasonalDesk({day,pool,open,reminder,onReminder,conditions}:{day:string;pool:Recipe[];open:(r:Recipe)=>void;reminder:boolean;onReminder:(b:boolean)=>void;conditions:NutritionCondition[]}){
 const {season,term,guide}=useMemo(()=>seasonalContext(day),[day]);
 const foods=useMemo(()=>seasonalFoods(pool,season),[pool,season]);
 const [chosen,setChosen]=useState<SeasonalGroup|null>(null),[message,setMessage]=useState('');
 const selected=chosen||(season==='冬'?'温补':season==='秋'?'润燥':'清热');
 const tradition=traditionalDishes(pool,selected);
 const match=foods.flatMap(f=>f.matches).at(0);
 function exportCalendar(){
   const cal=seasonCalendar(day,pool,location.origin);
   if(!cal.count){setMessage('当前条件下没有可导出的时令菜。');return}
   const url=URL.createObjectURL(new Blob([cal.content],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');
   a.href=url;a.download='食来运转-节气菜单.ics';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),2000);
   setMessage('已导出 '+cal.count+' 次节气提醒。导入你的日历后，按当地时间上午九点提醒。');
 }
 async function share(){
   if(!match)return;
   const note=(term?.name||season+'日')+'，今天一起吃'+match.title+'。'+foods[0].reason+'大约 '+match.time+' 分钟就能开饭。';
   try{await navigator.clipboard.writeText(note);setMessage('已复制当季推荐文案。')}catch{setMessage(note)}
 }
 return <><h2><Flower2/>{term?.name||season+'日'}的菜篮子</h2><p>{guide.termNote}</p><label className="desk-inline"><input type="checkbox" checked={reminder} onChange={e=>onReminder(e.target.checked)}/>本机首页显示当期节气提醒</label>
 <div className="desk-chips"><button onClick={exportCalendar}>导出节气日历提醒</button>{match&&<button onClick={share}>复制当季推荐</button>}</div>{message&&<p role="status">{message}</p>}
 {!foods.length&&<p>当前饮食和厨具条件下，暂时没有可推荐的当季食材搭配。</p>}
 {foods.map(f=><article key={f.name} className="season-item"><h3>{f.name}</h3><p>{f.reason} {f.tradition}</p><p><b>菜场怎么挑</b>　{f.selection}</p><div className="desk-chips">{f.matches.slice(0,3).map(r=><button key={r.id} onClick={()=>open(r)}>{r.title} · {r.time} 分钟</button>)}</div></article>)}
 <h3>传统食养怎么选</h3><p>按传统饮食习惯选口感和吃法。已套用本次忌口、身体情况与可用厨具。</p>
 <div className="desk-chips">{traditionalGroups.map(k=><button key={k} aria-pressed={selected===k} onClick={()=>setChosen(k)}>{k}</button>)}</div>
 <p>{selected==='清热'?'夏日常见的瓜汤和豆沙，入口清爽。':selected==='润燥'?'秋日常见的梨汤、银耳羹，质地柔软，有汤有水。':'寒天常见的慢炖汤和热饮，适口温热再喝。'}</p>
 {tradition.length?tradition.slice(0,4).map(r=><p key={r.id}><button className="desk-link" onClick={()=>open(r)}>{r.title} · {r.time} 分钟</button>　{assessNutrition(r,conditions).highlights[0]||r.tastes.join('、')}</p>):<p>这一类暂时没有符合条件的菜。</p>}
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
 return <><h2>{kind==='coach'?<ChefHat/>:<NotebookPen/>}{kind==='coach'?'厨艺闯关':'菜谱踩坑笔记'}</h2>{pool.length>0&&<DishPicker pool={pool} id={id} onChange={x=>{setId(x);setResult(null);setMethod('');setOutcome('');setNotice('')}}/>}{!dish?<p>没有匹配的菜，试试另一个菜名或调整条件。</p>:<>{kind==='pitfalls'?<><PitfallNotes key={dish.id} recipe={dish} restricted={restricted}/>{restricted&&(()=>{const alt=pool.find(r=>r.id!==dish.id&&r.category===dish.category);return alt?<p>按当前忌口换一道　<button className="desk-link" onClick={()=>open(alt)}>{alt.title}</button></p>:null})()}</>:<>
 <p className="desk-foot">{cookLevels.map(l=>l.name).join(' → ')} · 已完成 {store.data.cooking[0]?.completed?.length||0} 道不同菜。</p>
 <label>你怎么做的？<textarea value={method} maxLength={1200} onChange={e=>{setMethod(e.target.value);setResult(null)}} placeholder="例如 先炒鸡蛋盛出，再小火把番茄炒出汁"/></label><label>照片里或实物上的成品状态<textarea value={outcome} maxLength={800} onChange={e=>{setOutcome(e.target.value);setResult(null)}} placeholder="写下颜色、质地、熟度或你尝到的味道"/></label>
 <div className="desk-fields"><label>实际用时（分钟）<input type="number" min="1" max="2000" value={minutes} onChange={e=>{setMinutes(e.target.value);setResult(null)}}/></label><label className="desk-inline"><input type="checkbox" checked={failed} onChange={e=>{setFailed(e.target.checked);setResult(null)}}/>这次翻车了</label></div>
 <label className="desk-inline"><input type="checkbox" checked={independent} onChange={e=>{setIndependent(e.target.checked);setResult(null)}}/>这道菜由我独立完成</label><button className="desk-action" disabled={!store.ready||store.busy} onClick={judge}>提交本次闯关</button>{notice&&<p role="status">{notice}</p>}
 {result&&<section className="wish-paper"><p className="desk-kicker">厨艺复盘</p><h3><Award size={21}/> {result.report.levelName} · {result.report.score} 分</h3><p>{result.report.credited?'通关！饭本上又点亮了一道拿手菜。':result.report.progress.completed.some(r=>r.recipeId===dish.id)?'这道菜已留下独立完成记录。':'本次记作练习，下一锅再试。'}</p><p><b>本机文字模型</b>　{result.model.label||'描述不足，暂不判定'}。{result.model.advice}</p><p className="desk-foot">{result.model.basis} 仅处理你填写的文字。</p>
 {result.report.dimensions.map(d=><p key={d.name}><b>{d.name} {d.points}/{d.max}</b>　{d.reason}</p>)}<p>{result.report.basis} {result.report.advice.join(' ')}</p><p>{result.report.nextLevel}</p>{next&&<p>下一关　<button className="desk-link" onClick={()=>open(next)}>{next.title} · {next.difficulty} · {next.time} 分钟</button></p>}</section>}</>}</>}</>
}
