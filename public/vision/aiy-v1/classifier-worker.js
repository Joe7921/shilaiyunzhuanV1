// This worker receives decoded pixels from the page. Only same-origin static model assets are fetched.
let engine;
const asset=name=>new URL(name,self.location.href).href;
async function init(){
 importScripts(asset('core-classic.js'));
 const runtime=self.KitchenLiteRT;
 await runtime.loadLiteRt(asset('litert_wasm_compat_internal.js'));
 const [binary,labels]=await Promise.all([fetch(asset('model.tflite')),fetch(asset('labels.txt'))]);
 if(!binary.ok||!labels.ok)throw Error('assets');
 const model=await runtime.loadAndCompile(new Uint8Array(await binary.arrayBuffer()),{accelerator:'wasm'});
 const names=(await labels.text()).trim().split(/\r?\n/);
 if(names.length!==2024)throw Error('labels');
 return {model,names,Tensor:runtime.Tensor};
}
self.onmessage=async({data})=>{
 let input,output;
 try{
  engine??=init();
  const {model,names,Tensor}=await engine;
  if(!(data instanceof Uint8Array)||data.length!==192*192*3)throw Error('input');
  input=new Tensor(data,[1,192,192,3]);
  [output]=await model.run(input);
  const scores=await output.data();
  if(scores.length!==2024)throw Error('output');
  const ranks=Array.from(scores,(v,index)=>({index,score:v/256,label:names[index]})).sort((a,b)=>b.score-a.score).slice(0,5);
  self.postMessage({ranks});
 }catch{self.postMessage({error:'inference'});}
 finally{output?.delete();input?.delete();}
};
