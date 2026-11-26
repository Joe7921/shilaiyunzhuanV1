import {cities,skyFromCode,type City,type Sky,type WeatherReading} from '@/lib/palace';
export const dynamic='force-dynamic';

const TTL=15*60*1000;
const cache=new Map<string,{at:number;reading:WeatherReading}>();
const pending=new Map<string,Promise<WeatherReading>>();
async function weatherJson<T>(url:URL) {
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'ShilaiKitchen/2 (+https://shilai-yunzhuan.joe7921.chatgpt.site/)'},signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw Error('weather provider');
  return await response.json() as T;
}
function current(time:number) {return Number.isFinite(time)&&Math.abs(Date.now()-time)<3*3600000}
async function readWeather(lat:number,lon:number):Promise<WeatherReading>{
  try {
    const url=new URL('https://api.open-meteo.com/v1/forecast');
    url.search=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,weather_code,is_day',timeformat:'unixtime',timezone:'GMT'}).toString();
    const w=(await weatherJson<{current:{temperature_2m:number;weather_code:number;is_day:number;time:number}}>(url)).current,sky=skyFromCode(w.weather_code),time=w.time*1000;
    if(!sky||!Number.isFinite(w.temperature_2m)||![0,1].includes(w.is_day)||!current(time))throw Error('invalid reading');
    return {sky,temperature:w.temperature_2m,daylight:w.is_day===1,time,source:'Open-Meteo'};
  }catch {
    const url=new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');
    url.search=new URLSearchParams({lat:String(lat),lon:String(lon)}).toString();
    type Entry={time:string;data:{instant:{details:{air_temperature:number}};next_1_hours?:{summary:{symbol_code:string}}}};
    const series=(await weatherJson<{properties:{timeseries:Entry[]}}>(url)).properties.timeseries;
    const now=Date.now(),slot=series.filter(s=>s.data.next_1_hours&&Date.parse(s.time)<=now).at(-1);
    if(!slot||!current(Date.parse(slot.time)))throw Error('no current forecast');
    const code=slot.data.next_1_hours!.summary.symbol_code,temperature=slot.data.instant.details.air_temperature;
    if(!Number.isFinite(temperature)||!code)throw Error('invalid forecast');
    const sky:Sky=code.includes('thunder')?'storm':/snow|sleet/.test(code)?'snow':code.includes('rain')?'rain':code.includes('fog')?'fog':/cloud|fair/.test(code)?'cloud':'clear';
    const date=new Date(now),dayInYear=(now-Date.UTC(date.getUTCFullYear(),0,1))/86400000;
    const rad=Math.PI/180,decl=23.44*Math.sin((dayInYear-80)*2*Math.PI/365)*rad;
    const hour=(date.getUTCHours()+date.getUTCMinutes()/60+lon/15-12)*15*rad;
    const sunHeight=Math.sin(lat*rad)*Math.sin(decl)+Math.cos(lat*rad)*Math.cos(decl)*Math.cos(hour);
    const daylight=code.endsWith('_day')||(!code.endsWith('_night')&&sunHeight>0);
    return {sky,temperature,daylight,time:Date.parse(slot.time),source:'MET Norway'};
  }
}
export async function GET(request:Request) {
  const params=new URL(request.url).searchParams,city=params.get('city')||'';
  let lat:number,lon:number;
  if(Object.hasOwn(cities,city)){const location=cities[city as City];lat=location[1];lon=location[2]}
  else {
    const a=params.get('lat'),b=params.get('lon');
    if(!a?.trim()||!b?.trim()||!Number.isFinite(Number(a))||!Number.isFinite(Number(b))||Math.abs(Number(a))>90||Math.abs(Number(b))>180)return Response.json({error:'请选择天气地点'},{status:400});
    lat=Math.round(Number(a)*4)/4;lon=Math.round(Number(b)*4)/4;
  }
  const key=lat+','+lon,hit=cache.get(key);
  const ok=(r:WeatherReading)=>Response.json(r,{headers:{'Cache-Control':'private, max-age=300'}});
  if(hit&&Date.now()-hit.at<TTL)return ok(hit.reading);
  try {
    let operation=pending.get(key);
    if(!operation){operation=readWeather(lat,lon);pending.set(key,operation)}
    const reading=await operation;
    if(cache.size>=128&&!cache.has(key))cache.delete(cache.keys().next().value!);
    cache.set(key,{at:Date.now(),reading});return ok(reading);
  }catch{return Response.json({error:'天气服务暂时不可用'},{status:503,headers:{'Cache-Control':'no-store'}})}
  finally{pending.delete(key)}
}
