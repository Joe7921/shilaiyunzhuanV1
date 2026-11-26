import {assertSameOrigin,fail,HttpError,json,readJson} from '@/lib/server/http';
import {confirmedMeal} from '@/lib/vision/meal';
export const dynamic='force-dynamic';
// Older clients used to post an image key. Inference now runs on device; only confirmed foods can be estimated.
export async function POST(request:Request){
 try{
   assertSameOrigin(request);const data=await readJson(request);
   if(!data.confirmed||data.confirmed!==true||!Array.isArray(data.items))throw new HttpError(400,'请先在本机识别并确认菜品与份量。');
   try{return json(confirmedMeal(data.items))}catch(e){throw new HttpError(400,(e as Error).message)}
 }catch(e){return fail(e)}
}
