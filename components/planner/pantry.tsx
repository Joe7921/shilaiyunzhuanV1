'use client';
import {useMemo,useState} from 'react';
import {CirclePlus,IceCreamBowl,PackageOpen,Trash2} from 'lucide-react';
import {buildShoppingList,deductPantry,ingredientInfo} from '@/lib/planner/cost';
import {amountText,availableStock,dateAfter,money,type Stock} from '@/lib/planner/local';
import type {Recipe} from '@/lib/recipes';
import type {PlannerStore} from './use-planner-data';

export function Pantry({pool,people,today,store,open,restricted}:{restricted:boolean;pool:Recipe[];people:number;today:string;store:PlannerStore;open:(r:Recipe)=>void}){
 const [name,setName]=useState(''),[amount,setAmount]=useState(''),[unit,setUnit]=useState('克'),[expiry,setExpiry]=useState('');
 const [bulk,setBulk]=useState(''),[notice,setNotice]=useState(''),[bucket,setBucket]=useState('全部'),[limit,setLimit]=useState(5);
 const stock=store.data.pantry;
 const result=useMemo(()=>{
   const usable=availableStock(stock,today),soon=new Set(usable.filter(s=>s.expires&&s.expires<=dateAfter(today,3)).map(s=>ingredientInfo(s.name).name));
   return pool.map(recipe=>{
    const list=buildShoppingList([{recipe,people}],usable);
    const missing=list.items.filter(i=>i.toBuy>0.001),matched=list.items.filter(i=>i.fromPantry>0);
    return {recipe,list,missing,matched,expiring:matched.filter(i=>soon.has(i.name)).map(i=>i.name),group:missing.length===0?'零采购':missing.length===1?'只需要买1样':'需要采购多样'};
   }).sort((a,b)=>a.missing.length-b.missing.length||b.expiring.length-a.expiring.length||b.matched.length-a.matched.length||a.list.purchaseCost-b.list.purchaseCost||a.recipe.time-b.recipe.time);
 },[stock,pool,people,today]);
 const labels=['零采购','只需要买1样','需要采购多样'];
 const filtered=result.filter(r=>bucket==='全部'||r.group===bucket);
 async function insert(row:Stock[]){
   if(!row.length)return;if(await store.save('pantry',[...stock,...row])){setName('');setAmount('');setBulk('');setNotice('已加入库存。')}
 }
 async function add(){
   if(!name.trim()||!Number.isFinite(Number(amount))||Number(amount)<=0){setNotice('请填写食材名称和大于零的数量。');return}
   await insert([{id:crypto.randomUUID(),name:name.trim().slice(0,45),amount:Number(amount),unit:unit.trim(),expires:expiry}]);
 }
 async function consume(recipe:Recipe){
   const usable=availableStock(stock,today).sort((a,b)=>(a.expires||'9999').localeCompare(b.expires||'9999'));
   const updated=deductPantry(usable,[{recipe,people}]);if(!updated.ok){setNotice('库存已变化，请重新查看缺少的食材。');return}
   const amounts=new Map(updated.pantry.map(s=>[s.id,s.amount]));
   const next=stock.map(s=>({...s,amount:amounts.get(s.id)??s.amount})).filter(s=>s.amount>0);
   if(await store.save('pantry',next))setNotice('已按 '+people+' 人份扣除《'+recipe.title+'》用料，优先用了临期的那一份。');
 }
 function fromText(){
   const entries=bulk.split(/[，、,；;\n]+/).map(s=>s.trim()).filter(Boolean);
   const rows:Stock[]=[];
   for(const entry of entries){const m=entry.match(/^(.+?)\s*(\d+(?:\.\d+)?)\s*(千克|公斤|克|毫升|升|个|颗|片|根|只|枚|斤|kg|g|ml|L)$/i);
    if(!m||Number(m[2])<=0){setNotice('请补上数量和单位，例如「鸡蛋2个，土豆300克」。未导入任何一项。');return}
    rows.push({id:crypto.randomUUID(),name:m[1].trim(),amount:Number(m[2]),unit:m[3],expires:''});
   }
   void insert(rows);
 }
 return <><h2><PackageOpen/>冰箱有什么</h2><div className="desk-entry">
   <label>食材或调料<input value={name} onChange={e=>setName(e.target.value)} placeholder="例如 鸡蛋"/></label>
   <label>数量<input type="number" min=".01" step="any" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="2"/></label>
   <label>单位<select value={unit} onChange={e=>setUnit(e.target.value)}>{['克','千克','毫升','升','个','颗','片','根','只','斤'].map(u=><option key={u}>{u}</option>)}</select></label>
   <label>到期日（选填）<input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/></label><button className="desk-action" disabled={!store.ready||store.busy} onClick={add}><CirclePlus size={16}/>加入库存</button>
 </div><details className="desk-detail"><summary>批量录入食材和调料</summary><label>一行或一组食材<textarea value={bulk} onChange={e=>setBulk(e.target.value)} placeholder="鸡蛋2个，番茄400克，盐20克，食用油50毫升"/></label><button className="desk-button" disabled={!store.ready||store.busy||!bulk.trim()} onClick={fromText}>核对并加入</button></details>
 {notice&&<p role="status">{notice}</p>}
 {stock.length>0&&<ul className="pantry-stock">{[...stock].sort((a,b)=>(a.expires||'9999').localeCompare(b.expires||'9999')).map(s=><li key={s.id}><span><b>{s.name}</b> {s.amount}{s.unit}{s.expires&&<small>{s.expires<today?'已到期 · 排除推荐':s.expires+' 到期'}</small>}</span><button title={'移除'+s.name} aria-label={'从库存移除'+s.name} disabled={store.busy} onClick={()=>store.save('pantry',stock.filter(x=>x.id!==s.id))}><Trash2 size={15}/></button></li>)}</ul>}
 <h3>用现有食材做什么</h3>{!stock.length&&<p>先填冰箱里的食材，下面会标出能直接做的菜。</p>}
 <div className="desk-chips">{['全部',...labels].map(l=><button key={l} aria-pressed={bucket===l} onClick={()=>{setBucket(l);setLimit(5)}}>{l} {l==='全部'?result.length:result.filter(x=>x.group===l).length}</button>)}</div>
 {filtered.slice(0,limit).map(x=><article className="pantry-dish" key={x.recipe.id}><button className="dish-thumb" onClick={()=>open(x.recipe)}><img loading="lazy" alt={x.recipe.title} src={x.recipe.image}/></button><div><span className="desk-kicker">{x.group} · {x.recipe.time} 分钟 · {x.recipe.difficulty}</span><h4><button onClick={()=>open(x.recipe)}>{x.recipe.title}</button></h4>
 <p>{x.expiring.length>0&&<b>优先用掉 {x.expiring.join('、')}。 </b>}{x.missing.length?'需补 '+x.missing.map(i=>i.name+' '+amountText(i.toBuy)+i.unit).join('、'):'库存用量够这顿饭。'}</p>
 <details><summary>食材、储存与替换</summary><p>{x.list.items.map(i=>i.name+' '+amountText(i.required)+i.unit).join('、')}</p><p>预计补购耗用 {money(x.list.purchaseCost)}。</p><p>{x.list.items[0]?.storage}</p><p>{!restricted&&x.list.items.some(i=>i.substitutes.length)?'可替换：'+x.list.items.filter(i=>i.substitutes.length).slice(0,2).map(i=>i.name+'可用'+i.substitutes[0]).join('；'):'可调整份量保留原配方；不确定能否替换时，优先选上方库存匹配的其他菜。'}</p>{restricted&&(()=>{const alt=result.find(a=>a.recipe.id!==x.recipe.id&&a.recipe.category===x.recipe.category);return alt?<p>符合当前限制的另一种做法　<button className="desk-link" onClick={()=>open(alt.recipe)}>{alt.recipe.title}</button></p>:null})()}{x.recipe.tip&&<p>{x.recipe.tip}</p>}{!x.missing.length&&<button className="desk-button" disabled={!store.ready||store.busy} onClick={()=>consume(x.recipe)}>做好了，扣除本餐用料</button>}</details></div></article>)}
 {!filtered.length&&<p>这一档暂无符合条件的菜谱。</p>}{limit<filtered.length&&<button className="desk-button" onClick={()=>setLimit(n=>n+6)}>再看六道</button>}
 {!result.some(x=>!x.missing.length&&['主食','热菜'].includes(x.recipe.category))&&<div className="desk-aside"><h3><IceCreamBowl size={18}/>先看简单小食或饮品</h3>{result.filter(x=>/小吃|饮品|甜品|糖水/.test(x.recipe.category)).slice(0,2).map(x=><p key={x.recipe.id}><button className="desk-link" onClick={()=>open(x.recipe)}>{x.recipe.title}</button> · {x.missing.length?'还缺 '+x.missing.map(i=>i.name).join('、'):'现有库存可做'}</p>)}</div>}
 </>;
}
