import {useState} from 'react';
import {Check,Clipboard,UserRound} from 'lucide-react';
import {allergenOptions,habitOptions,tasteOptions,terms,validGuest,type Guest} from '@/lib/table';

export function Switches({items,value,onChange}:{items:string[];value:string[];onChange:(v:string[])=>void}){
 return <div className="table-chips">{items.map(item=><button key={item} type="button" aria-pressed={value.includes(item)} onClick={()=>onChange(value.includes(item)?value.filter(x=>x!==item):[...value,item])}>{item}{value.includes(item)&&<Check size={13}/>}</button>)}</div>;
}
export function GuestForm({initial,save,cancel,personal=false}:{initial:Guest;save:(p:Guest)=>string|void;cancel?:()=>void;personal?:boolean}){
 const [guest,setGuest]=useState(initial),[favorites,setFavorites]=useState(initial.favorites.join('、')),[avoid,setAvoid]=useState(initial.avoid.join('、')),[error,setError]=useState('');
 function submit(e:React.FormEvent){e.preventDefault();const p={...guest,name:guest.name.trim(),favorites:terms(favorites),avoid:terms(avoid)};
   const err=validGuest(p)||save(p);setError(err||'');
 }
 return <form className="guest-form" onSubmit={submit}>
   <label>昵称<input className="field" aria-label="饭搭子昵称" placeholder="例如 小栗" maxLength={20} value={guest.name} onChange={e=>setGuest({...guest,name:e.target.value})} required/></label>
   <fieldset><legend>偏爱的口味</legend><Switches items={tasteOptions} value={guest.tastes} onChange={tastes=>setGuest({...guest,tastes})}/></fieldset>
   <label>爱吃的菜<input className="field" aria-label="爱吃的菜" value={favorites} maxLength={500} onChange={e=>setFavorites(e.target.value)} placeholder="例如 番茄炒蛋、铜锣烧"/></label>
   <label>不吃的食材<input className="field" aria-label="不吃的食材" value={avoid} maxLength={500} onChange={e=>setAvoid(e.target.value)} placeholder="例如 香菜、牛肉"/></label>
   <details open={initial.habits.length+initial.allergens.length>0||undefined}><summary>过敏原与饮食习惯{guest.allergens.length+guest.habits.length>0?'（已选 '+(guest.allergens.length+guest.habits.length)+' 项）':''}</summary>
   <fieldset><legend>避开的过敏原</legend><Switches items={allergenOptions} value={guest.allergens} onChange={allergens=>setGuest({...guest,allergens})}/></fieldset>
   <fieldset><legend>饮食习惯</legend><Switches items={habitOptions} value={guest.habits} onChange={habits=>setGuest({...guest,habits})}/></fieldset></details>
   {error&&<p role="alert">{error}</p>}
   <div className="table-actions"><button type="submit" className="primary-button">{personal?<Clipboard size={16}/>:<UserRound size={16}/>} {personal?'生成我的口味卡':'保存这位饭搭子'}</button>{cancel&&<button type="button" className="text-button" onClick={cancel}>取消编辑</button>}</div>
 </form>;
}
export function CopyText({value,label}:{value:string;label:string}){
 const [status,setStatus]=useState(''),[fallback,setFallback]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(value);setStatus('已复制，可以粘贴给好友。');setFallback(false)}catch{setFallback(true);setStatus('长按或选中下方文字即可复制。')}}
 return <div className="table-copy"><button className="flat-button" onClick={copy}><Clipboard size={15}/>{label}</button>{status&&<small role="status">{status}</small>}{fallback&&<textarea aria-label="可复制内容" className="field" readOnly value={value} onFocus={e=>e.target.select()}/>}</div>;
}
