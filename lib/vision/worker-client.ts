export type Category={index:number;label:string;score:number};

let worker:Worker|undefined;
let active=false;
let idle:ReturnType<typeof setTimeout>|undefined;

function release(){
  worker?.terminate();
  worker=undefined;
}
export async function predict(canvas:HTMLCanvasElement):Promise<Category[]>{
  if(active)throw Error('上一张照片正在识别。');
  active=true;
  clearTimeout(idle);
  try{
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('无法读取图像。');
    const rgba=ctx.getImageData(0,0,192,192).data;
    const rgb=new Uint8Array(192*192*3);
    for(let i=0,j=0;i<rgba.length;i+=4){
      rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];
    }
    const engine=worker??=new Worker('/vision/aiy-v1/classifier-worker.js');
    return await new Promise<Category[]>((resolve,reject)=>{
      const fail=()=>{clearTimeout(timeout);release();reject(Error('设备上的识别引擎未能运行。'));};
      const timeout=setTimeout(fail,120000);
      engine.onerror=fail;
      engine.onmessage=({data})=>{
        clearTimeout(timeout);
        if(!Array.isArray(data?.ranks)){fail();return;}
        resolve(data.ranks);
      };
      engine.postMessage(rgb,[rgb.buffer]);
    });
  }finally{active=false;idle=setTimeout(release,45000);}
}
