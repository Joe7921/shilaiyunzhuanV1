import {useEffect,useRef,useState} from 'react';
import {BookOpen,Dices,Heart,RotateCcw,Ticket,Users} from 'lucide-react';
import {drawTable,tableRemark,type Table} from '@/lib/table';
import type {Recipe} from '@/lib/recipes';
import {FoodImage} from '../ui';
import {CopyText} from './guest';

export function DishRow({r,open}:{r:Recipe;open:(r:Recipe)=>void}){
 return <button className="table-dish" onClick={()=>open(r)}><FoodImage recipe={r}/><span><strong>{r.title}</strong><small>{r.time} 分钟 · {r.difficulty} · {r.tastes.slice(0,2).join('、')}</small></span><BookOpen size={17}/></button>;
}
export function MatchResult({table,open}:{table:Table;open:(r:Recipe)=>void}){
 const {score,names,common,avoid,blocked,pool}=table;
 const picks=pool.slice(0,3).map(x=>x.r);
 const groups=[['都爱吃',common.join('、')||'暂时没有全员都填的菜'],['一起避开',avoid.join('、')||'未填写忌口'],...(blocked.length?[['这桌先跳过',blocked.join('、')]]:[]),['一起点',picks.map(r=>r.title).join('、')||'暂时没有符合全员条件的菜']];
 const caption=tableRemark(score);
 const text=['食来运转 · 美食默契大考验',names.join(' × '),score===null?'口味资料待补充':'口味默契 '+score+' 分',caption,...groups.map(g=>g[0]+' · '+g[1])].join('\n');
 return <section className="table-result" aria-label="默契结果"><article className="match-ticket"><p className="table-stamp"><Ticket size={18}/> 食来运转 · 饭搭子鉴定单</p>
   <h2>{names.join(' × ')}</h2><div className="match-score">{score===null?'待补充':score}{score!==null&&<small>分 / 100</small>}</div><p className="match-verdict">{caption}</p>
   <dl>{groups.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><footer><Heart size={15}/> 今天也要一起好好吃饭</footer></article>
   <div className="table-result-share"><CopyText value={text} label="复制结果发好友"/><small>上方鉴定单可直接截图。</small></div>
   <details><summary>分数怎么算？</summary><p>将每两人的口味、爱吃菜和饮食习惯分别比较，按重合项占双方全部选项的比例打分。权重依次为 45%、40%、15%，只计算两人都填写的维度，再取所有组合的平均分。过敏原和忌口用于筛菜。</p></details>
   {picks.length>0&&<><h3>打开共同菜谱</h3>{picks.map(r=><DishRow key={r.id} r={r} open={open}/>)}</>}
 </section>;
}
const colors=['#f1c1ca','#f3daa3','#bddad5','#c7dbee','#d9cbe3','#f3cdb1'];
function WheelFace({items,angle}:{items:Recipe[];angle:number}){
 const point=(angle:number,r:number)=>[150+Math.cos(angle*Math.PI/180)*r,150+Math.sin(angle*Math.PI/180)*r];
 const n=items.length;
 return <div className="team-wheel"><i aria-hidden="true"/><svg role="img" aria-label={'本轮转盘，'+n+' 道菜'} viewBox="0 0 300 300" style={{transform:'rotate('+angle+'deg)'}}>
 {items.map((r,i)=>{const start=-90+i*360/n,end=start+360/n,center=(start+end)/2;
 return <g key={r.id}>{n===1?<circle cx="150" cy="150" r="144" fill={colors[0]}/>:<path d={'M150 150L'+point(start,144).join(' ')+' A144 144 0 '+Number(end-start>180)+' 1 '+point(end,144).join(' ')+' Z'} fill={colors[i%colors.length]} stroke="#fff9f2" strokeWidth="2"/>}
 <g transform={'translate('+point(center,92).join(' ')+') rotate('+(center>90?center+180:center)+')'}><text textAnchor="middle" dominantBaseline="central" fontSize={n>8?12:14} fontWeight="650" fill="#513d3d">{r.title.length>6?r.title.slice(0,5)+'…':r.title}</text></g></g>})}
 <circle cx="150" cy="150" r="26" fill="#fff5df" stroke="#af7773" strokeWidth="2"/><circle cx="150" cy="150" r="9" fill="#cb8087"/></svg></div>
}
function tray(pool:Table['pool']){
 const remaining=[...pool],items:Recipe[]=[];
 while(remaining.length&&items.length<10){
   const [pick]=drawTable(remaining);items.push(pick);remaining.splice(remaining.findIndex(p=>p.r.id===pick.id),1);
 }return items;
}
export function TeamWheel({table,open}:{table:Table;open:(r:Recipe)=>void}){
 const [items,setItems]=useState(()=>tray(table.pool)),[angle,setAngle]=useState(0),[running,setRunning]=useState(false),[chosen,setChosen]=useState<Recipe[]>([]);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);useEffect(()=>()=>clearTimeout(timer.current),[]);
 function spin(){
   if(running||!items.length)return;
   const picks=drawTable(items.map(r=>({r,rank:0}))),idx=items.findIndex(r=>r.id===picks[0].id);
   setChosen([]);setRunning(true);
   setAngle(a=>a-(a%360)+360*5-(idx+.5)*360/items.length);
   const delay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1400;
   timer.current=setTimeout(()=>{setChosen(picks);setRunning(false)},delay);
 }
 const excluded=table.avoid.join('、')||'未填写忌口';
 return <section className="table-result team-result"><p className="table-stamp"><Users size={17}/>{table.names.join(' × ')}</p><h2>今晚转到哪道菜？</h2><p>大家一起避开 · {excluded}</p>
 {items.length?<><p className="table-sub">{table.pool.length} 道符合全员条件，本轮上盘 {items.length} 道。</p><WheelFace items={items} angle={angle}/><div className="table-actions"><button className="primary-button" disabled={running} onClick={spin}><Dices size={17}/>{running?'转盘转动中':'转出今晚的菜'}</button>{table.pool.length>10&&<button className="flat-button" disabled={running} onClick={()=>{setItems(tray(table.pool));setChosen([])}}><RotateCcw size={15}/>换一桌菜</button>}</div>
 <div aria-live="polite">{chosen.length>0&&<><h3>今晚就吃{chosen[0].title}</h3><DishRow r={chosen[0]} open={open}/>{chosen.length>1&&<h4>备选菜</h4>}{chosen.slice(1).map(r=><DishRow r={r} open={open} key={r.id}/>)}<CopyText label="复制本轮结果" value={['食来运转 · 组队轮盘',table.names.join(' × '),'一起避开 · '+excluded,'今晚就吃 · '+chosen[0].title,...(chosen.length>1?['备选 · '+chosen.slice(1).map(r=>r.title).join('、')]:[])].join('\n')}/></>}</div></>:<p className="table-empty">这桌暂时没有共同候选菜。可以核对填写的条件，保留每个人的过敏限制。</p>}</section>;
}
