import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const {outputFiles}=await build({stdin:{contents:"export * from './lib/table';export * from './lib/blindbox';export * from './lib/palace';export {calendarYear} from './lib/calendar/calendar.mjs';export {recipes} from './lib/recipes';export {matchesPrefs} from './lib/client';export {assessNutrition} from './lib/planner/nutrition';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {recipes,tableFor,newGuest,encodeCard,decodeCard,drawTable,moodMenu,boxPool,openBox,isDessert,festivalFor,calendarYear,matchesPrefs,assessNutrition}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].contents).toString('base64'));
const defaultPrefs={excluded:[],maxTime:0,vegetarian:false};
const guest=(name,p={})=>({...newGuest(),name,...p});
const group=[guest('甲',{tastes:['咸鲜'],favorites:['番茄炒蛋'],allergens:['花生']}),guest('乙',{tastes:['咸鲜'],favorites:['西红柿炒鸡蛋'],avoid:['牛肉']}),guest('丙',{tastes:['清淡'],favorites:['番茄炒鸡蛋'],habits:['不吃辣']})];
test('pairwise compatibility compares all participants, normalizes aliases and distinguishes missing data from zero',()=>{
 assert.equal(tableFor(group.slice(0,2)).score,100);
 const v=tableFor(group);
 assert.equal(v.score,65);assert.deepEqual(v.common,['番茄炒蛋']);assert.deepEqual(tableFor([...group].reverse()).score,v.score);
 assert.equal(tableFor([guest('a',{tastes:['酸甜']}),guest('b',{tastes:['奶香']})]).score,0);
 assert.equal(tableFor([guest('a'),group[0]]).score,null);
 assert.deepEqual([...v.avoid].sort(),['牛肉','花生过敏','不吃辣'].sort());
});
test('every group restriction applies to recommendations, rotation and alternatives',()=>{
 const v=tableFor(group);
 for(const {r} of v.pool){assert(matchesPrefs(r,{...defaultPrefs,excluded:['花生'],avoid:['牛肉']}));assert(!r.tastes.some(t=>t.includes('辣')))}
 const restricted=tableFor([group[0],guest('乙',{allergens:['蛋']})]);
 assert(restricted.blocked.includes('番茄炒蛋'));assert(!restricted.pool.some(x=>x.r.id==='tomato-eggs'));
 const empty=tableFor([guest('1',{allergens:['蛋']}),guest('2')],recipes.filter(r=>r.id==='tomato-eggs'));
 assert.deepEqual(drawTable(empty.pool),[]);const one=v.pool.slice(0,1);assert.equal(drawTable(one).length,1);
 const three=drawTable(v.pool);assert.equal(three.length,3);assert.equal(new Set(three.map(r=>r.id)).size,3);
});
test('a copied taste card round-trips; malformed cards are rejected',()=>{
 for(const g of group)assert.deepEqual(decodeCard(encodeCard(g)),g);
 assert.equal(decodeCard('口味：咸鲜'),null);assert.equal(decodeCard(encodeCard(group[0])+'\n谢谢'),null);
});
test('moods use saved diet and allergen restrictions and lead to real different recipes',()=>{
 const prefs={...defaultPrefs,excluded:['奶','花生'],avoid:['牛肉']};
 const pools=['疲惫','烦躁','低落 / emo','开心','压力大'].map(m=>moodMenu(m,prefs,['素食','乳糖不耐']));
 for(const list of pools){assert(list.length>0);for(const {r,reason} of list){assert(matchesPrefs(r,prefs));assert(assessNutrition(r,['素食','乳糖不耐']).eligible);assert(reason.length>15&&r.steps.length>=3);assert(!r.alcohol)}}
 assert(new Set(pools.map(l=>l[0].r.id)).size>=3);
 assert.deepEqual(moodMenu('疲惫',prefs,[],()=>false),[]);
});
test('dessert draws use their own safe pool and exhaust without repeats',()=>{
 const pool=boxPool(recipes.filter(r=>!r.allergens.includes('奶')),true,false,false);
 assert(pool.length>5&&pool.every(isDessert));assert(boxPool(recipes,false,false,false).every(r=>!isDessert(r)));
 assert(boxPool(recipes,true,true,true).every(r=>r.time<=30&&!r.tools.some(t=>t.includes('烤箱'))));
 let seen=[],last;const round=[];
 for(let i=0;i<pool.length;i++){const d=openBox(pool,seen,last,()=>.5);seen=d.seen;last=d.recipe.id;round.push(last)}
 assert.equal(new Set(round).size,pool.length);assert.notEqual(openBox(pool,seen,last).recipe.id,last);assert.equal(openBox([],[],null),null);
});
test('new kitchen themes follow each year’s real lunar calendar and Halloween',()=>{
 for(const year of [2026,2027,2030])for(const [id,theme] of [['dragon-boat','dragonboat'],['mid-autumn','midautumn'],['qixi','qixi'],['halloween','halloween']]){
   const event=calendarYear(year).find(e=>e.id===id);assert.equal(festivalFor(event.date),theme)
 }
});
test('all twelve researched desserts and four new kitchens have verified unique local assets and source attribution',async()=>{
 const {createHash}=await import('node:crypto');
 const refs=JSON.parse(await readFile('docs/sources/desserts.json','utf8'));
 const credit=JSON.parse(await readFile('public/images/dessert/credits.json','utf8'));
 assert.equal(credit.length,12);
 for(const item of credit){
   const r=recipes.find(r=>r.id===item.id);assert(isDessert(r));
   assert.equal(r.recipeSource,refs[r.id].url);assert(r.time>=r.activeMinutes);
   assert(r.steps.length>=3&&r.ingredients.length>=3);
   if(item.type==='photo')assert(r.imageSource&&r.imageLicenseUrl);
   const bytes=await readFile('public'+r.image);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
 }
 const geo=JSON.parse(await readFile('lib/palace-holidays.json','utf8'));
 const credits=JSON.parse(await readFile('docs/sources/festival-kitchens.json','utf8'));
 assert.equal(credits.length,4);
 for(const g of Object.values(geo)){
   assert(g.aperture.width>=500&&g.flame.x>g.aperture.x+g.aperture.width);
   const bytes=await readFile('public/images/palace/'+g.file);assert(bytes.includes(Buffer.from('ALPH')));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),credits.find(x=>x.file===g.file).sha256);
 }
});
