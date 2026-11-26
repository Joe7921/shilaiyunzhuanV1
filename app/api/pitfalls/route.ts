import {assertSameOrigin,database,fail,getUser,HttpError,idField,json,readJson,requireUser} from '@/lib/server/http';
import {recipes} from '@/lib/recipes';
import {pitfallTopics} from '@/lib/planner/topics';
export const dynamic='force-dynamic';
const ids=new Set(recipes.map(r=>r.id));
function dish(value:unknown){const id=idField(value,'菜谱编号');if(!ids.has(id))throw new HttpError(404,'菜谱不存在');return id}
async function report(id:string,userId:string|null){
  const db=database();
  const [counts,contributors,mine]=await Promise.all([
    db.prepare('SELECT topic,COUNT(*) AS n FROM kitchen_pitfalls WHERE recipe_id = ? GROUP BY topic ORDER BY n DESC,topic').bind(id).all<{topic:string;n:number}>(),
    db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM kitchen_pitfalls WHERE recipe_id = ?').bind(id).first<{n:number}>(),
    userId?db.prepare('SELECT topic FROM kitchen_pitfalls WHERE recipe_id = ? AND user_id = ? ORDER BY topic').bind(id,userId).all<{topic:string}>():Promise.resolve({results:[]}),
  ]);
  return {counts:counts.results,contributors:contributors?.n||0,mine:mine.results.map(r=>r.topic),canSubmit:!!userId};
}
export async function GET(request:Request){
  try{return json(await report(dish(new URL(request.url).searchParams.get('recipe')),getUser(request)?.id||null))}catch(e){return fail(e)}
}
export async function POST(request:Request){
  try{
    assertSameOrigin(request);const user=requireUser(request),body=await readJson(request),id=dish(body.recipe);
    if(!Array.isArray(body.topics)||body.topics.length>6||body.topics.some(k=>typeof k!=='string'||!Object.hasOwn(pitfallTopics,k)))throw new HttpError(400,'请选择已有的踩坑项目');
    const db=database(),topics=Array.from(new Set(body.topics as string[])),now=new Date().toISOString();
    const statements=[db.prepare('DELETE FROM kitchen_pitfalls WHERE recipe_id=? AND user_id=?').bind(id,user.id),
      ...topics.map(topic=>db.prepare('INSERT INTO kitchen_pitfalls(recipe_id,user_id,topic,updated_at) VALUES(?,?,?,?)').bind(id,user.id,topic,now))];
    await db.batch(statements);return json(await report(id,user.id));
  }catch(e){return fail(e)}
}
