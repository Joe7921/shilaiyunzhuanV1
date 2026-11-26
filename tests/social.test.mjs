import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

test('D1 and R2 preserve the V1 profile, voting, photo diary, sharing and deletion flows',async t=>{
  const source = `import * as kitchen from './app/api/kitchen/route';
    import {POST as upload} from './app/api/upload/route';
    import {POST as estimate} from './app/api/estimate/route';
    import {GET as image} from './app/api/image/route';
    export default {fetch(req){const name=new URL(req.url).pathname.slice(5);
      if(name==='kitchen')return req.method==='GET'?kitchen.GET(req):kitchen.POST(req);
      return ({upload,estimate,image})[name](req)}}`;
  const {outputFiles}=await build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',external:['cloudflare:workers'],logLevel:'silent'});
  const mf=new Miniflare({modules:true,script:outputFiles[0].text,d1Databases:['DB'],r2Buckets:['BUCKET'],compatibilityDate:'2026-05-15'});
  t.after(()=>mf.dispose());
  const db=await mf.getD1Database('DB');
  const sql=await readFile('drizzle/0000_flippant_next_avengers.sql','utf8');
  for(const stmt of sql.split('--> statement-breakpoint').filter(s=>s.trim())) await db.prepare(stmt.trim()).run();
  const req=(user,path,init={})=>mf.dispatchFetch('http://localhost'+path,{...init,headers:{...(user?{'oai-authenticated-user-id':user}:{}),...init.headers}});
  const get=async(user,path)=>(await req(user,'/api/kitchen'+path)).json();
  async function post(user,body){
    const res=await req(user,'/api/kitchen',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    assert(res.ok,await res.clone().text());return res.json();
  }
  const mine='fixture-a',peer='fixture-b';
  assert.equal((await get(mine,'?resource=me')).user.id,mine);
  await post(mine,{action:'save-profile',favorites:['season-yam-ribs']});
  await post(mine,{action:'save-profile',personality:'fresh'});
  assert.deepEqual(await get(mine,'?resource=profile'),{favorites:['season-yam-ribs'],personality:'fresh'});
  const poll=(await post(mine,{action:'create-poll',title:'测试晚餐',options:[{id:'season-yam-ribs',label:'山药排骨汤'},{id:'tomato-eggs',label:'番茄炒蛋'}]})).poll;
  for(const optionId of ['season-yam-ribs','tomato-eggs']){
    const result=(await post(peer,{action:'vote',id:poll.id,optionId})).poll;
    assert.equal(result.myVote,optionId);assert.equal(result.totalVotes,1);
  }
  assert.equal((await get(mine,'?resource=poll&id='+poll.id)).poll.totalVotes,1);
  const file=await readFile('public/images/dishes/tomato-eggs.webp');
  const form=new FormData();form.set('file',new Blob([file],{type:'image/webp'}),'recipe.webp');
  const multipart=new Request('http://localhost/api/upload',{method:'POST',body:form});
  const uploaded=await req(mine,'/api/upload',{method:'POST',headers:{'content-type':multipart.headers.get('content-type')},body:await multipart.arrayBuffer()});
  assert.equal(uploaded.status,201,await uploaded.clone().text());
  const {imageKey,imageUrl}=await uploaded.json();
  const entry={action:'create-post',title:'测试晚餐',body:'试做记录',recipeId:'season-yam-ribs',imageKey,kcal:300};
  const priv=(await post(mine,{...entry,visibility:'private'})).post;
  assert.equal((await get(mine,'?resource=posts&scope=mine')).posts[0].id,priv.id);
  assert.equal((await get(peer,'?resource=posts&scope=community')).posts.length,0);
  assert.equal((await req(peer,imageUrl)).status,404);
  const pub=(await post(mine,{...entry,visibility:'community'})).post;
  assert.equal((await get(peer,'?resource=posts&scope=community')).posts[0].id,pub.id);
  const picture=await req(peer,imageUrl);assert.deepEqual(Buffer.from(await picture.arrayBuffer()),file);
  assert.equal((await post(peer,{action:'toggle-like',id:pub.id})).likes,1);
  assert.equal((await post(peer,{action:'toggle-like',id:pub.id})).likes,0);
  const ai=await req(mine,'/api/estimate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({imageKey})});
  assert.equal(ai.status,503);assert.match(await ai.text(),/尚未连接/);
  for(const {id} of [pub,priv])assert((await post(mine,{action:'delete-post',id})).success);
  assert.equal((await get(mine,'?resource=posts&scope=mine')).posts.length,0);
});

