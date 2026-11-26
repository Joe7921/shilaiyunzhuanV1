import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';

const {outputFiles}=await build({stdin:{contents:"export * from './lib/palace';export {GET} from './app/api/weather/route'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {palaceConditions,seasonFor,festivalFor,skyFromCode,GET}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].contents).toString('base64'));
test('palace seasons, lunar holidays, Christmas and weather-driven effects',async()=>{
  for(const [d,n,s] of [['03-02','spring','autumn'],['07-03','summer','winter'],['10-02','autumn','spring'],['12-01','winter','summer']]){
    assert.equal(seasonFor('2026-'+d,22),n);assert.equal(seasonFor('2026-'+d,-33),s);
  }
  for(const date of ['2026-02-16','2026-02-17','2027-02-06'])assert.equal(festivalFor(date),'lunar');
  assert.equal(festivalFor('2026-02-24'),'plain');assert.equal(festivalFor('2026-12-24'),'christmas');
  assert.deepEqual([0,2,45,61,75,95,16].map(skyFromCode),['clear','cloud','fog','rain','snow','storm',null]);
  const cold={sky:'snow',temperature:-2,daylight:false};
  assert.deepEqual(palaceConditions('live',cold,'christmas',false,'winter'),{sky:'snow',night:true,fire:true,fireworks:true});
  assert.equal(palaceConditions('live',{...cold,daylight:true},'lunar',false,'spring').fireworks,false);
  assert.equal(palaceConditions('live',{...cold,temperature:20},'plain',true,'winter').fire,false);
  assert.equal(palaceConditions('live',null,'plain',false,'winter').fire,false);
  assert.equal(palaceConditions('eve',null,'plain',false,'winter').fireworks,false);
  const images=await Promise.all(['room','spring','summer','autumn','winter'].map(k=>readFile('public/images/palace/'+k+'.webp')));
  assert.equal(new Set(images.map(i=>i.toString('base64'))).size,5);
});
test('weather handles live readings, caching, coarse coordinates, backup and outages',async t=>{
  const request=(query)=>GET(new Request('https://example.test/api/weather?'+query));
  assert.equal((await request('lat=999&lon=113')).status,400);
  let calls=[],now=Date.now();
  const upstream=t.mock.method(globalThis,'fetch',async url=>{
    calls.push(new URL(url));return Response.json({current:{temperature_2m:8.4,weather_code:61,is_day:0,time:Math.floor(now/1000)}});
  });
  assert.equal((await (await request('lat=22.31&lon=113.63')).json()).sky,'rain');
  assert.equal(calls[0].searchParams.get('latitude'),'22.25');assert.equal(calls[0].searchParams.get('longitude'),'113.75');
  await request('lat=22.30&lon=113.64');assert.equal(calls.length,1);
  upstream.mock.mockImplementation(async url=>String(url).includes('open-meteo')?Response.json({current:{temperature_2m:10,weather_code:1,is_day:1,time:0}}):Response.json({properties:{timeseries:[{time:new Date(now-2000).toISOString(),data:{instant:{details:{air_temperature:-5}},next_1_hours:{summary:{symbol_code:'heavysnow_night'}}}}]}}));
  const backup=await(await request('city=harbin')).json();assert.equal(backup.source,'MET Norway');assert.equal(backup.sky,'snow');assert.equal(backup.daylight,false);
  upstream.mock.mockImplementation(async()=>new Response(null,{status:503}));
  assert.equal((await request('city=london')).status,503);
});
test('three full holiday kitchens have wide windows, separate illustrations, and correctly positioned effects',async()=>{
 const geometry=JSON.parse(await readFile('lib/palace-scenes.json','utf8'));
 const credits=JSON.parse(await readFile('docs/sources/palace-v7.json','utf8'));
 const {createHash}=await import('node:crypto');
 for(const [room,layout] of Object.entries(geometry)){
   const frame=await readFile('public/images/palace/'+room+'.webp');
   assert.equal(createHash('sha256').update(frame).digest('hex'),credits.find(x=>x.file===room+'.webp').sha256);
   assert.ok(frame.includes(Buffer.from('ALPH')));
   assert.ok(layout.window.width>=465&&layout.window.height>=340);
   assert.ok(layout.flame.x>layout.window.x+layout.window.width);
   assert.ok(layout.visibleWindowFraction>.2);
 }
 assert.equal(new Set(credits.map(x=>x.sha256)).size,3);
 assert.ok(geometry.christmas.lights.length>12);
 assert.equal(geometry.lunar.lanterns.length,2);
});
