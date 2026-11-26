'use client';
import {useMemo,useState} from 'react';
import {BookOpenCheck,ClipboardList,Coins,PartyPopper,Share2} from 'lucide-react';
import type {Recipe} from '@/lib/recipes';
import {assessNutrition,type NutritionCondition} from '@/lib/planner/nutrition';
import {buildShoppingList,estimateRecipe,priceKey,type ShoppingResult,type PriceOverrides} from '@/lib/planner/cost';
import {planMenu,type MenuMode} from '@/lib/planner/menu';
import {availableStock,money,amountText,periodSummary,type Constraints} from '@/lib/planner/local';
import {seasonOf} from '@/lib/astro';
import type {PlannerStore} from './use-planner-data';

function Shopping({list,prices,onPrice}:{list:ShoppingResult;prices:PriceOverrides;onPrice:(key:string,value:string)=>void}){
 return <details className="desk-detail" open><summary>分类采购清单</summary><p className="desk-foot">按配方耗用量和参考单价估算；整包起售、运费和燃料另计。可按当地价格改单价。</p>
 {list.groups.map(g=>{const need=g.items.filter(i=>i.toBuy>0);if(!need.length)return null;return <section className="shopping-group" key={g.category}><h4>{g.category}</h4>{need.map(i=><div key={i.name+i.unit}><span>{i.name} <b>{amountText(i.toBuy)}{i.unit}</b></span><span>{i.purchaseCost===null?'待补价格':money(i.purchaseCost)}</span><label>单价<input aria-label={i.name+'参考单价'} type="number" min="0" step=".1" value={prices[priceKey(i.name,i.unit)]??i.unitPrice??''} onChange={e=>onPrice(priceKey(i.name,i.unit),e.target.value)}/>{i.priceUnit}</label></div>)}</section>})}
 {!list.items.some(i=>i.toBuy>0)&&<p>所需食材都在库存中。</p>}</details>;
}
export function MenuDesk({kind,conditions,pool,store,today,open}:{kind:'diet'|'party'|'saving';conditions:Constraints;pool:Recipe[];store:PlannerStore;today:string;open:(r:Recipe)=>void}){
 const [weekly,setWeekly]=useState(false),[made,setMade]=useState(false),[wants,setWants]=useState(['凉菜','热菜','汤','甜品']),[prices,setPrices]=useState<PriceOverrides>({});
 const [share,setShare]=useState(false),[copied,setCopied]=useState('');
 const mode:MenuMode=kind==='party'?'party':kind==='saving'?(weekly?'saveWeek':'saveDay'):(weekly?'week':'day');
 const inventory=useMemo(()=>availableStock(store.data.pantry,today),[store.data.pantry,today]);
 const result=useMemo(()=>made?planMenu({mode,people:conditions.people,budget:conditions.budget,inventory,tastes:conditions.tastes,wants,pool,prices,season:seasonOf(today)}):null,[made,mode,conditions,inventory,wants,pool,prices,today]);
 const title=kind==='party'?'饭局菜单':kind==='saving'?'省钱厨房':'我的定制食谱';
 const poster=result?['食来运转 · 今晚一起开饭',conditions.people+' 位入席',...result.serveOrder,'预计食材补购 '+money(result.totalCost),'开席前先做 '+(result.prepOrder[0]||'备料')].join('\n'):'';
 function onPrice(key:string,value:string){setPrices(prev=>{const next={...prev};if(!value)delete next[key];else if(Number(value)>=0&&Number.isFinite(Number(value)))next[key]=Number(value);return next})}
 async function copy(){try{await navigator.clipboard.writeText(poster);setCopied('海报文案已复制')}catch{setCopied('可选中下面的文字复制')}}
 return <><h2>{kind==='party'?<PartyPopper/>:kind==='saving'?<Coins/>:<BookOpenCheck/>}{title}</h2>
 {kind==='party'?<div className="desk-chips" aria-label="饭局菜式">{['凉菜','热菜','汤','甜品'].map(t=><button key={t} aria-pressed={wants.includes(t)} onClick={()=>setWants(wants.includes(t)?wants.filter(x=>x!==t):[...wants,t])}>{t}</button>)}</div>:<div className="desk-chips" aria-label="预算周期"><button aria-pressed={!weekly} onClick={()=>setWeekly(false)}>一天</button><button aria-pressed={weekly} onClick={()=>setWeekly(true)}>一周七天</button></div>}
 <p className="desk-foot">{conditions.people} 人 · {kind==='party'?'本次饭局':weekly?'七天总':'当天'}预算 {money(conditions.budget)} · 已扣除可用库存。</p>
 <button className="desk-action" onClick={()=>setMade(true)}><ClipboardList size={17}/>{kind==='party'?'搭配饭局菜单':kind==='saving'?'按预算配餐':'生成定制食谱'}</button>
 {result&&<><p className={'menu-total '+(result.status==='ready'?'':'needs-work')}><b>{result.status==='ready'?'这份菜单在预算内':result.status==='overBudget'?'这份搭配超过预算':'部分条件尚未满足'}</b> 预计补购 {money(result.totalCost)}{result.shortfall? ' · 差额 '+money(result.shortfall):''}</p>{result.reasons.map((r,i)=><p key={i}>{r}</p>)}
 {result.days.map(d=><details className="desk-day" key={d.day} open={!weekly||d.day===1}><summary>{kind==='party'?'这一桌吃什么':'第 '+d.day+' 天'}</summary>{d.meals.map(m=><section className="desk-meal" key={m.name}><h4>{m.name}</h4>{m.items.map((item,index)=>{
 const r=item.recipe,assessment=assessNutrition(r,conditions.conditions as NutritionCondition[]),cost=estimateRecipe(r,item.people,prices),tastes=r.tastes.filter(t=>conditions.tastes.some(p=>p.includes(t)||t.includes(p)));
 return <div className="menu-dish" key={r.id+index}><div><button className="desk-link" onClick={()=>open(r)}>{r.title}</button><small> {item.role} · {amountText(item.people)} 人份 · {r.time} 分钟 · 食材约 {money(cost.totalCost)}</small></div>
 {kind!=='party'&&<details><summary>适合理由与提醒{conditions.conditions.includes('减脂')?' · 约 '+Math.round(r.kcal/r.servings)+' 千卡/标准人份':''}</summary><p>{tastes.length?'合你偏爱的'+tastes.join('、')+'口味。':'以'+r.luckyIngredient+'搭配'+r.tastes[0]+'口味。'}{assessment.highlights.join(' ')||'这道'+r.category+'可以和本餐其他菜品搭配。'}</p><p>{assessment.cautions.join(' ')||r.tip}</p><p>可少放一部分咸味调料，另外蘸取；喜欢浓香时保留本菜的{r.tastes[0]}做法。</p></details>}</div>
 })}{m.note&&<small>{m.note}</small>}</section>)}</details>)}
 {kind==='party'&&<><h3>开工与上菜顺序</h3><p>先做 {result.prepOrder.join(' → ')||'暂无可排菜品'}</p><p>上桌 {result.serveOrder.join(' → ')||'暂无可排菜品'}</p>{result.status==='ready'&&<><button className="desk-button" onClick={()=>setShare(!share)}><Share2 size={16}/>聚餐邀请海报</button>{share&&<div className="party-poster"><span>食来运转 · 家宴请柬</span><h3>今晚，一起开饭。</h3><p>{conditions.people} 位入席</p>{result.serveOrder.map(x=><p key={x}>{x}</p>)}<button className="desk-button" onClick={copy}>复制海报文案</button>{copied&&<span role="status">{copied}</span>}</div>}</>}</>}
 <Shopping list={result.shopping} prices={prices} onPrice={onPrice}/></>}
 {kind==='saving'&&<Ledger store={store} today={today} days={weekly?7:1} budget={conditions.budget}/>}</>;
}
function Ledger({store,today,days,budget}:{store:PlannerStore;today:string;days:number;budget:number}){
 const [start,setStart]=useState(today),[baseline,setBaseline]=useState(''),[date,setDate]=useState(today),[spent,setSpent]=useState(''),[memo,setMemo]=useState(''),[notice,setNotice]=useState('');
 const r=periodSummary(store.data.expenses,start||today,days,budget,baseline.trim()&&Number(baseline)>=0?Number(baseline):null,today);
 async function add(){if(!date||date>today||!Number.isFinite(Number(spent))||Number(spent)<=0){setNotice('请填写有效购买日期和正数实付金额。');return}
 const ok=await store.save('expenses',[...store.data.expenses,{id:crypto.randomUUID(),date,amount:Number(spent),note:memo.trim().slice(0,60)}]);if(ok){setNotice('实付已记入本期账本。');setSpent('');setMemo('')}}
 return <div className="desk-aside"><h3><Coins size={18}/>我的实付账本</h3><div className="desk-fields"><label>周期起日<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>以往同周期实付（选填）<input type="number" min="0" placeholder="用于计算实际节省" value={baseline} onChange={e=>setBaseline(e.target.value)}/></label></div>
 <div className="desk-fields"><label>购买日期<input type="date" max={today} value={date} onChange={e=>setDate(e.target.value)}/></label><label>实付金额（元）<input type="number" min=".01" step=".01" value={spent} onChange={e=>setSpent(e.target.value)}/></label><label>购买内容<input value={memo} maxLength={60} placeholder="例如 番茄和鸡蛋" onChange={e=>setMemo(e.target.value)}/></label></div><button className="desk-button" disabled={!store.ready||store.busy} onClick={add}>记一笔实付</button>{notice&&<p role="status">{notice}</p>}
 <button className="desk-button" disabled={!store.ready||store.busy||!start} onClick={async()=>{const id=start+'/'+days;const ok=await store.save('budgets',[...store.data.budgets.filter(c=>c.id!==id),{id,start,days,budget,baseline:baseline.trim()?Number(baseline):null}]);if(ok)setNotice('已保存预算周期，到期后可在这里查看对照报告。')}}>保存本期预算与对照</button>
 <h4>{r.ended?'周期结束 · 省钱报告':'本期小计'} · {start} 至 {r.end}</h4><p>已记 {r.records.length} 笔，实付 {money(r.actual)}，预算{r.remaining>=0?'剩余':'超出'} {money(Math.abs(r.remaining))}。</p><p>{r.saving===null?'填入以往同周期实付并记账后，可比较两期支出。':(r.ended?'本期':'截至目前')+'较对照期'+(r.saving>=0?'少花 ':'多花 ')+money(Math.abs(r.saving))+'。'}</p>
 {r.records.length>0&&<ul>{r.records.map(e=><li key={e.id}>{e.date}　{e.note||'食材'}　{money(e.amount)}　<button className="desk-link" disabled={store.busy} onClick={()=>store.save('expenses',store.data.expenses.filter(x=>x.id!==e.id))}>撤销</button></li>)}</ul>}
 {store.data.budgets.length>0&&<details className="desk-detail"><summary>已存周期与到期报告</summary>{store.data.budgets.map(c=>{const summary=periodSummary(store.data.expenses,c.start,c.days,c.budget,c.baseline,today);return <p key={c.id}><b>{c.start} 至 {summary.end} · {summary.ended?'已结算':'进行中'}</b>，已记 {summary.records.length} 笔，实付 {money(summary.actual)}。{summary.saving===null?'尚缺实付记录或对照金额。':(summary.saving>=0?'比对照期少花 ':'比对照期多花 ')+money(Math.abs(summary.saving))+'。'}</p>})}</details>}
 <p className="desk-foot">先看现有食材和到期日。散装按本餐所需购买，分装标好日期，先用先买的那一份。</p></div>
}
