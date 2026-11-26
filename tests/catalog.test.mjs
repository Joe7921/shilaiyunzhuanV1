import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {calendarYear} from '../lib/calendar/calendar.mjs';
const compiled=await build({stdin:{contents:`export {recipes} from './lib/recipes';export {zodiac,fortuneFor} from './lib/astro';export {matchesPrefs,defaultPrefs} from './lib/client';export {arrangeWheel} from './lib/wheel'`,resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {recipes,zodiac,fortuneFor,matchesPrefs,defaultPrefs,arrangeWheel}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));

test('complete unique recipes and individual decodable WebP assets',async()=>{
  const ids=new Set(),titles=new Set(),paths=new Set(),digests=new Set();
  for(const r of recipes){
    assert.match(r.id,/^[a-z0-9-]+$/);assert(!ids.has(r.id));ids.add(r.id);
    assert(!titles.has(r.title),r.title);titles.add(r.title);
    for(const field of ['title','description','category','cuisine','difficulty','colorName','luckyIngredient','tip','imageCredit'])assert(r[field]?.trim(),r.id+' '+field);
    assert(r.servings>0&&r.kcal>0&&r.time>0,r.id);
    for(const field of ['steps','tools','tastes','seasons','ingredients'])assert(r[field].length,r.id+' '+field);
    assert(r.steps.length>=3,r.id);assert(r.ingredients.every(i=>i.name&&i.unit&&Number.isFinite(i.amount)&&i.amount>0),r.id);
    assert(!paths.has(r.image),r.id);paths.add(r.image);
    const file=await readFile('public'+r.image);
    assert.equal(file.toString('ascii',8,12),'WEBP',r.image);
    const digest=createHash('sha256').update(file).digest('hex');assert(!digests.has(digest),r.image);digests.add(digest);
    if(r.alcohol)assert(recipes.some(alt=>alt.id===r.alternativeId&&!alt.alcohol));
  }
  assert.equal(recipes.filter(r=>r.series).length,27);
  assert.equal(new Set(recipes.filter(r=>r.series).map(r=>r.series)).size,6);
  for(const e of calendarYear(2026,'2000-04-20')){
    assert(recipes.some(r=>r.festivals.includes(e.name)||e.menu.some(x=>[r.title,...r.aliases].includes(x))),e.name);
  }
});
test('all 12 conventional zodiac boundaries, invalid inputs and leap days',()=>{
  const cutoffs=[20,19,21,20,21,21,23,23,23,23,22,22];
  const signs=['水瓶','双鱼','白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯'];
  for(let i=0;i<12;i++){
    const month='2000-'+String(i+1).padStart(2,'0')+'-';
    assert.equal(zodiac(month+cutoffs[i]).name,signs[i]+'座');
    assert.equal(zodiac(month+(cutoffs[i]-1)).name,signs[(i+11)%12]+'座');
  }
  assert.equal(zodiac('2001-02-29'),null);assert.equal(zodiac('2000-02-29').name,'双鱼座');
});
test('today is stable for unknown and known times; the next day generates a new reading',()=>{
  for(const time of ['','08:15']){
    const birth={date:'2000-04-20',time};
    const get=(day,pool=recipes)=>fortuneFor(birth,day,pool,['清淡']);
    const today=get('2026-11-26');
    assert.deepEqual(today,get('2026-11-26',[...recipes].reverse()));
    assert(today.dessert&&today.drink&&today.alternatives.length===3);
    const next=get('2026-11-27');assert.notDeepEqual([today.number,today.main.id,today.color],[next.number,next.main.id,next.color]);
    assert.equal(get('2026-11-26',[]),null);
  }
});
test('allergens and avoided ingredients apply to every fortune result and the full wheel rotation',()=>{
  for(const blocked of new Set(recipes.flatMap(r=>r.allergens))){
    const prefs={...defaultPrefs,excluded:[blocked],avoid:['香菜']};
    const eligible=recipes.filter(r=>matchesPrefs(r,prefs));
    const reading=fortuneFor({date:'2000-04-20',time:''},'2026-11-26',eligible);
    for(const r of [reading.main,...reading.alternatives,reading.dessert,reading.drink].filter(Boolean)){
      assert(!r.allergens.includes(blocked));assert(!r.ingredients.some(i=>i.name.includes('香菜')));assert(!r.alcohol);
    }
    const wheel=arrangeWheel(eligible);
    for(const table of wheel){assert.equal(table.length,Math.min(12,eligible.length));assert.equal(new Set(table.map(r=>r.id)).size,table.length)}
    assert.equal(new Set(wheel.flat().map(r=>r.id)).size,eligible.length);
  }
  const veganCandidates=recipes.filter(r=>matchesPrefs(r,{...defaultPrefs,vegetarian:true}));
  for(const title of ['胡椒猪肚鸡','山药排骨汤','鲜虾西兰花','黑椒牛柳'])assert(!veganCandidates.some(r=>r.title===title),title);
  assert(veganCandidates.some(r=>r.title==='番茄炒蛋'));
});


test('custom exclusions recognize cuts, aliases and allergen labels',()=>{
  const eligible=(title,avoid)=>matchesPrefs(recipes.find(r=>r.title===title),{...defaultPrefs,avoid:[avoid]});
  assert.equal(eligible('番茄肥牛暖锅','牛肉'),false);
  assert.equal(eligible('番茄炒蛋','西红柿'),false);
  assert.equal(eligible('可乐鸡翅','酒精'),false);
  assert.equal(eligible('可乐鸡翅','鸡肉'),false);
  assert.equal(eligible('番茄炒蛋','鸡肉'),true);
  assert.equal(eligible('无酒精香料热饮','酒精'),true);
});
