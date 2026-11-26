'use client';
import {useState} from 'react';
import {CircleCheck,Plus,Search,Trash2} from 'lucide-react';
import {confirmedMeal,foodById,foods,type Meal} from '@/lib/vision/meal';
import type {SuggestedDish} from '@/lib/vision/prediction';
import servingSizes from '@/lib/vision/portions.json';

type Draft={key:number;id:string;amount:string};
type Portion={label:string;grams:number};
const measures:Record<string,Portion[]>=servingSizes;
export function MealConfirmation({suggestions,initialId,onChange,onConfirm,confirmed}:{suggestions:SuggestedDish[]|null;initialId:string;onChange:()=>void;onConfirm:(m:Meal)=>void;confirmed:Meal|null}){
 const [rows,setRows]=useState<Draft[]>([{key:0,id:initialId,amount:initialId?'1':''}]);
 const [query,setQuery]=useState(''),[active,setActive]=useState(0),[error,setError]=useState('');
 const row=rows.find(r=>r.key===active)??rows[0];
 function update(next:Draft[]){setRows(next);setError('');onChange();}
 function select(id:string){const f=foodById(id);if(!f)return;update(rows.map(r=>r.key===row.key?{...r,id,amount:f.unit==='克'?'100':'1'}:r));setQuery('');}
 const choices=foods.filter(f=>!query.trim()||[f.title,...f.aliases].some(n=>n.toLowerCase().includes(query.trim().toLowerCase())));
 function confirm(){
   try{const result=confirmedMeal(rows.map(r=>({id:r.id,amount:Number(r.amount)})));onConfirm(result);setError('');}catch(e){setError((e as Error).message);}
 }
 return <section className="meal-confirm">
 <h3>核对菜品和实际吃下的份量</h3>
 {suggestions!==null&&<div className="dish-candidates">{suggestions.length?<><p>照片里的主要食物可能是</p>{suggestions.map(s=><div key={s.index}><b>{s.title}</b>{s.approximate&&<small> 相近做法，请核对</small>}{s.ids.length?<div className="meal-chips">{s.ids.slice(0,5).map(id=><button type="button" key={id} onClick={()=>select(id)}>{foodById(id)?.title}</button>)}</div>:<small> 请选择下方最接近的实际做法。</small>}</div>)}</>:<p>这张照片没有足够明确的菜品线索。可以再拍近些，或在下方手动选菜。</p>}</div>}
 <label className="meal-search"><Search size={16}/> 搜索或改选食物<input className="field" type="search" value={query} placeholder="输入菜名，例如 米饭、番茄炒蛋" onChange={e=>setQuery(e.target.value)}/></label>
 <label className="meal-select">选择第 {rows.indexOf(row)+1} 项食物<select className="field" value={choices.some(f=>f.id===row.id)?row.id:''} onChange={e=>select(e.target.value)}><option value="">请选择实际吃的食物</option>{choices.map(f=><option key={f.id} value={f.id}>{f.title} · {f.unit==='克'?'按克':'按菜谱人份'}</option>)}</select></label>
 {query&&!choices.length&&<p>未找到这个做法。可换一个关键词，或使用下方的手填热量。</p>}
 <ol className="meal-lines">{rows.map((r,i)=>{const f=foodById(r.id);return <li key={r.key}><div className="meal-line-name"><button type="button" aria-pressed={active===r.key} onClick={()=>{setActive(r.key);setQuery('')}}>{i+1}. {f?.title||'待选食物'}</button>{rows.length>1&&<button type="button" aria-label={'移除第'+(i+1)+'项'} onClick={()=>{const n=rows.filter(x=>x.key!==r.key);update(n);if(active===r.key)setActive(n[0].key)}}><Trash2 size={15}/></button>}</div>
 {f&&<><label className="measure-field">实际吃了<input aria-label={'第'+(i+1)+'项份量'} type="number" step="any" min=".01" max={f.unit==='克'?5000:20} value={r.amount} onChange={e=>update(rows.map(x=>x.key===r.key?{...x,amount:e.target.value}:x))}/>{f.unit}</label>
 {f.unit==='人份'?<small>本站配方整道分 {recipesServings(f.id)} 人份。半份请填 0.5。</small>:<><small>称可食部分的重量。100 克为起始值。 <a href={f.source} target="_blank" rel="noreferrer">USDA 参考条目</a></small>{measures[f.id]?.length>0&&<div className="meal-chips">{measures[f.id].slice(0,4).map(m=><button key={m.label} type="button" onClick={()=>update(rows.map(x=>x.key===r.key?{...x,amount:String(m.grams)}:x))}>{m.label} · {m.grams} 克</button>)}</div>}</>}</>}</li>})}</ol>
 {rows.length<12&&<button type="button" className="text-button" onClick={()=>{const key=Math.max(...rows.map(x=>x.key))+1;update([...rows,{id:'',amount:'',key}]);setActive(key);setQuery('')}}><Plus size={16}/>加一道菜或主食</button>}
 <button className="secondary-button confirm-meal" disabled={!rows.every(r=>r.id&&Number(r.amount)>0)||!!confirmed} type="button" onClick={confirm}><CircleCheck size={17}/>确认菜品和份量，估算热量</button>
 {error&&<p className="inline-error" role="alert">{error}</p>}
 {confirmed&&<div className="meal-result" role="status"><strong>这餐约 {confirmed.kcal} 千卡</strong>{confirmed.items.map((r,i)=><small key={i}>{r.title} · {r.amount} {r.unit} · 约 {r.kcal} 千卡</small>)}<small>按所选菜谱或食物成分折算，实际用油、酱汁和做法会影响结果。</small></div>}
 </section>;
}
import {recipes} from '@/lib/recipes';
function recipesServings(id:string){return recipes.find(r=>r.id===id)?.servings||1}
