import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {readFile} from 'node:fs/promises';
const entry="export * from './lib/planner/local';export * from './lib/planner/season';export * from './lib/planner/cost';export * from './lib/planner/menu';export * from './lib/planner/coach';export * from './lib/planner/cook-model';export * from './lib/planner/nutrition';export * from './lib/planner/wish';export {recipes} from './lib/recipes';";
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const {recipes,buildShoppingList,planMenu,availableStock,periodSummary,assessNutrition,makeWish,assessCook,predictCookIssue,pitfallsFor,cookLevels,seasonalGuide}=api;
test('pantry measures quantities, aliases, deadlines, shortages and prices across all 232 recipes',()=>{
 const r=recipes.find(r=>r.id==='tomato-eggs'),pantry=r.ingredients.map(i=>({...i,expires:'2026-12-01'}));
 assert.deepEqual(buildShoppingList([{recipe:r,people:r.servings}],availableStock(pantry,'2026-11-26')).items.filter(i=>i.toBuy>0),[]);
 assert(availableStock(pantry,'2026-12-02').length===0);
 const lower=pantry.map(i=>({...i,amount:i.name==='鸡蛋'?1:i.amount}));
 assert.equal(buildShoppingList([{recipe:r,people:r.servings}],lower).items.filter(i=>i.toBuy>0).length,1);
 for(const r of recipes)assert.deepEqual(api.estimateRecipe(r).missingPrices,[],r.id);
});
test('eight-tool workflows use real recipes, structured substitutions and clear budget failures',()=>{
 const c=(mode,budget,more={})=>planMenu({pool:recipes,mode,people:2,budget,...more});
 for(const mode of ['day','week','saveDay','saveWeek']){const r=c(mode,400);assert.equal(r.status,'ready');assert(r.totalCost<=400);assert.equal(r.days.length,/week/i.test(mode)?7:1);for(const d of r.days){assert.equal(d.meals.length,3);for(const m of d.meals)assert(m.items.length>0)}}
 const dinner=c('party',250,{people:6,wants:['凉菜','热菜','汤','甜品']});assert.equal(dinner.status,'ready');assert(dinner.serveOrder.length>=6);assert(dinner.prepOrder.length===dinner.serveOrder.length);
 assert(c('party',250,{wants:['甜品']}).serveOrder.every(x=>!x.includes('热菜')&&!x.includes('汤羹')&&!x.includes('凉菜')));
 assert.notEqual(c('week',0).status,'ready');
 const dairy=recipes.find(r=>r.title==='奶香南瓜浓汤');assert(!assessNutrition(dairy,['乳糖不耐']).eligible);
 assert(recipes.filter(r=>assessNutrition(r,['清真']).eligible).every(r=>!r.alcohol));
 const wish=makeWish({text:'宿舍无锅，想要开胃',budget:18,people:2,avoid:['牛奶'],tools:['无锅'],excludes:['奶']});assert.equal(wish.status,'ok');assert(wish.recipes.every(r=>r.estimatedCost<=18&&r.steps.length&&r.ingredients.length&&!r.allergens.includes('奶')));
 assert.equal(makeWish({text:'开胃',budget:0,people:3,avoid:[],tools:[]}).status,'unavailable');
 const report=periodSummary([{date:'2026-11-24',amount:15},{date:'2026-11-26',amount:7}],'2026-11-24',1,45,24,'2026-11-26');assert.equal(report.saving,9);assert.equal(report.actual,15);assert(report.ended);
 for(const s of ['春','夏','秋','冬'])assert(seasonalGuide(s).foods.length===4);
});
test('cooking classifier and levels separate text evidence, failure, genuine practices and repeat recipes',()=>{
 assert.deepEqual(cookLevels.map(l=>l.name),['厨房小白','新手学徒','家常菜能手','创意主厨','美食大神']);
 const recipe=recipes[0],input={recipe,method:'鸡蛋先打散，以中火轻推炒至蛋液凝固，然后把番茄炒软，再倒回鸡蛋轻轻翻炒。',outcome:'番茄出汁酸甜，鸡蛋全熟嫩滑，出锅时红亮。下次少放一点盐。',minutes:19,failed:false};
 const good=assessCook(input);assert(good.credited);assert(!assessCook({...input,independent:false}).credited);assert(!assessCook(input,good.progress).credited);assert(!assessCook({...input,failed:true}).credited);
 assert.equal(predictCookIssue('我照着菜谱做了','没留下成品图').label,null);assert.equal(predictCookIssue('炒菜','锅底一圈全黑，有焦苦味').label,'糊焦');
 for(const r of recipes){for(const p of pitfallsFor(r).hardPoints){assert(p.step>=1&&p.step<=r.steps.length);assert(r.steps[p.step-1].includes(p.evidence))}}
});
test('additive D1 migration keeps V1 rows, isolates private planner entries and records actual unique feedback only',async t=>{
 const contents="import * as a from './app/api/planner/route';import * as b from './app/api/pitfalls/route';export default {fetch(req){const api=new URL(req.url).pathname==='/planner'?a:b;return req.method==='GET'?api.GET(req):api.POST(req)}}";
 const {outputFiles}=await build({stdin:{contents,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',external:['cloudflare:workers']});
 const mf=new Miniflare({modules:true,script:outputFiles[0].text,d1Databases:['DB'],compatibilityDate:'2026-05-15'});t.after(()=>mf.dispose());
 const db=await mf.getD1Database('DB');
 async function migrate(path){const sql=await readFile(path,'utf8');for(const stmt of sql.split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(stmt.trim()).run()}
 await migrate('drizzle/0000_flippant_next_avengers.sql');await db.prepare("INSERT INTO kitchen_profiles(user_id,updated_at) VALUES('old','test')").run();await migrate('drizzle/0001_kitchen_planner.sql');
 assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM kitchen_profiles WHERE user_id='old'").first()).n,1);
 const req=(user,url,body)=>mf.dispatchFetch('http://localhost'+url,{method:body?'POST':'GET',headers:{...(user?{'oai-authenticated-user-id':user}:{}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const stock={section:'pantry',revision:0,value:[{id:'egg',name:'鸡蛋',amount:2,unit:'个',expires:''}]};
 assert.equal((await req(null,'/planner')).status,401);assert.equal((await req('a','/planner',stock)).status,200);assert.equal((await req('a','/planner',stock)).status,409);assert.deepEqual((await (await req('b','/planner')).json()).sections,{});
 const path='/pitfalls?recipe=tomato-eggs',body={recipe:'tomato-eggs',topics:['salt','salt']};
 assert.equal((await (await req(null,path)).json()).contributors,0);
 await req('a',path,body);await req('a',path,body);await req('b',path,body);
 const r=await (await req('a',path)).json();assert.deepEqual(r.counts,[{topic:'salt',n:2}]);assert.equal(r.contributors,2);assert.deepEqual(r.mine,['salt']);
 assert.equal((await (await req('a',path,{...body,topics:[]})).json()).contributors,1);
});
test('term boundaries, eligible seasonal foods, traditional groups and personal calendar invitations',()=>{
 assert.equal(api.seasonalContext('2026-11-26').season,'冬');
 assert.equal(api.seasonalContext('2026-11-26').term.name,'小雪');
 assert.equal(api.seasonalContext('2026-11-06').season,'秋');
 assert.equal(api.seasonalContext('2026-11-07').season,'冬');
 const veg=recipes.filter(r=>assessNutrition(r,['素食']).eligible);
 for(const group of ['清热','润燥','温补'])assert(api.traditionalDishes(veg,group).every(r=>r.vegetarian&&!r.alcohol));
 assert.deepEqual(api.seasonalFoods([],'夏'),[]);
 const cal=api.seasonCalendar('2026-11-26',veg,'https://example.org');
 assert.equal(cal.count,24);assert.equal((cal.content.match(/BEGIN:VALARM/g)||[]).length,24);
 assert.equal((cal.content.match(/BEGIN:VEVENT/g)||[]).length,24);
 assert(cal.content.includes('DTSTART:20261207T090000'));assert(cal.content.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
 assert.equal(api.seasonCalendar('2026-11-26',[],'https://example.org').count,0);
});
test('original recipes and substitutions observe dietary constraints before ranking',()=>{
 const reviewed=new Set();const w=makeWish({text:'小朋友想吃不上火的清爽小吃',budget:35,people:2,tools:[],avoid:[]},r=>{if(r.allergens.includes('奶')||!r.ingredients.some(i=>i.name.includes('番茄')))return false;reviewed.add(r.id);return true});
 assert.equal(w.status,'ok');for(const r of w.recipes){assert(reviewed.has(r.id));assert(r.substitutions.every(s=>reviewed.has(s.recipeId)))}
 assert.equal(makeWish({text:'宿舍无锅',budget:20,people:1,tools:[],avoid:[]},()=>false).status,'unavailable');
});
