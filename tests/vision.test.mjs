import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {build} from 'esbuild';

const built=await build({stdin:{contents:"export * from './lib/vision/meal';export {suggestions} from './lib/vision/prediction';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {foods,confirmedMeal,suggestions}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));
const assets=resolve('public/vision/aiy-v1');
test('actual published WASM model classifies a separate, open-source photograph of mapo tofu',async()=>{
 globalThis.self=globalThis;
 globalThis.importScripts=path=>{
   globalThis.__dirname=dirname(resolve(path));
   globalThis.require=createRequire(import.meta.url);
   vm.runInThisContext(readFileSync(path,'utf8'),{filename:path});
 };
 importScripts(resolve(assets,'core-classic.js'));
 const {loadLiteRt,loadAndCompile,Tensor}=globalThis.KitchenLiteRT;
 await loadLiteRt(resolve(assets,'litert_wasm_compat_internal.js'));
 const model=await loadAndCompile(new Uint8Array(readFileSync(resolve(assets,'model.tflite'))),{accelerator:'wasm'});
 const photo=new Tensor(new Uint8Array(gunzipSync(readFileSync('tests/fixtures/mapo-rgb.gz'))),[1,192,192,3]);
 const [prediction]=await model.run(photo);
 try{
   const scores=await prediction.data(),labels=readFileSync(resolve(assets,'labels.txt'),'utf8').trim().split(/\r?\n/);
   const ranks=Array.from(scores,(n,index)=>({index,score:n/256,label:labels[index]})).sort((a,b)=>b.score-a.score);
   assert.equal(ranks[0].index,468);assert.ok(ranks[0].score>.3);
   assert.ok(suggestions(ranks.slice(0,5))[0].ids.some(id=>foods.find(f=>f.id===id)?.title.includes('麻婆豆腐')));
 }finally{prediction.delete();photo.delete();model.delete();}
});
test('unconfident or background predictions abstain and never produce calories',()=>{
 for(const sample of [[],[{index:0,score:.8,label:'background'}],[{index:468,score:.07,label:'Mapo doufu'}]])assert.deepEqual(suggestions(sample),[]);
 assert.ok(!('kcal' in suggestions([{index:468,score:.8,label:'Mapo doufu'}])[0]));
});
test('calories are calculated from confirmed edible grams or recipe servings including fractional portions',()=>{
 const rice={id:'fdc-168878',amount:150},dish=foods.find(f=>f.title==='宫保鸡丁');
 assert.equal(confirmedMeal([rice]).kcal,195);
 const half={id:dish.id,amount:.5};
 assert.equal(confirmedMeal([rice,half]).kcal,195+Math.round(dish.energy*.5));
 for(const input of [[],Array(13).fill(rice),[{id:'unknown',amount:1}],...[0,-1,Infinity,NaN,'100',5001].map(amount=>[{...rice,amount}])])assert.throws(()=>confirmedMeal(input));
});
