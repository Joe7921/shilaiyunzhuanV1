import {assertSameOrigin,database,fail,HttpError,json,readJson,requireUser} from '@/lib/server/http';
export const dynamic='force-dynamic';
const sections=['pantry','expenses','cooking','budgets'] as const;
function smallText(v:unknown,max:number){return typeof v==='string'&&v.trim().length>0&&v.length<=max}
function amount(v:unknown,zero=false){return typeof v==='number'&&Number.isFinite(v)&&v<1e9&&(zero?v>=0:v>0)}
function day(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===v}
function validEntries(section:string,rows:unknown[]){
 const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const keys=(r:Record<string,unknown>,only:string[])=>Object.keys(r).every(k=>only.includes(k));
 if(section==='cooking')return rows.length<=1&&rows.every(r=>record(r)&&keys(r,['version','completed'])&&r.version===1&&Array.isArray(r.completed)&&r.completed.length<=400&&r.completed.every(x=>record(x)&&keys(x,['recipeId','techniques','advanced','reflection'])&&smallText(x.recipeId,120)&&Array.isArray(x.techniques)&&x.techniques.length<=4&&x.techniques.every(z=>smallText(z,35))&&typeof x.advanced==='boolean'&&typeof x.reflection==='boolean'));
 return rows.every(r=>{
   if(!record(r)||!smallText(r.id,100))return false;
   if(section==='pantry')return keys(r,['id','name','unit','amount','expires'])&&smallText(r.name,45)&&smallText(r.unit,12)&&amount(r.amount)&&(r.expires===''||day(r.expires));
   if(section==='expenses')return keys(r,['id','date','amount','note'])&&day(r.date)&&amount(r.amount)&&typeof r.note==='string'&&r.note.length<=60;
   return keys(r,['id','start','days','budget','baseline'])&&day(r.start)&&(r.days===1||r.days===7)&&amount(r.budget,true)&&(r.baseline===null||amount(r.baseline,true));
 })&&new Set(rows.map(r=>(r as Record<string,unknown>).id)).size===rows.length;
}
export async function GET(request:Request){
  try{
    const user=requireUser(request);
    const rows=await database().prepare('SELECT section,data,revision FROM kitchen_planner_state WHERE user_id=?').bind(user.id).all<{section:string;data:string;revision:number}>();
    return json({sections:Object.fromEntries(rows.results.map(r=>[r.section,{value:JSON.parse(r.data),revision:r.revision}]))});
  }catch(e){return fail(e)}
}
export async function POST(request:Request){
  try{
    assertSameOrigin(request);const user=requireUser(request),body=await readJson(request);
    if(!sections.includes(body.section as typeof sections[number])||!Number.isSafeInteger(body.revision)||(body.revision as number)<0||!Array.isArray(body.value)||body.value.length>400||!validEntries(String(body.section),body.value))throw new HttpError(400,'资料格式有误，请重新打开');
    const value=JSON.stringify(body.value);if(value.length>27000)throw new HttpError(400,'记录过多，请先整理较早记录');
    const now=new Date().toISOString(),db=database(),rev=Number(body.revision),section=String(body.section);
    const result=rev===0?
      await db.prepare('INSERT INTO kitchen_planner_state(user_id,section,data,revision,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(user_id,section) DO NOTHING').bind(user.id,section,value,now).run():
      await db.prepare('UPDATE kitchen_planner_state SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND section=? AND revision=?').bind(value,now,user.id,section,rev).run();
    if(!result.meta.changes)throw new HttpError(409,'另一台设备已更新，已保留该设备的记录。请刷新后重新操作。');
    return json({revision:rev+1});
  }catch(e){return fail(e)}
}
