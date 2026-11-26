'use client';
import {useEffect,useState} from 'react';
import {BookOpen,Castle,ChevronDown,CloudSun,Flame,Flower2,Leaf,LocateFixed,MapPin,Moon,Gift,Sailboat,Heart,Cat,TreePine,SlidersHorizontal,Snowflake,Sparkles,Sun,TreeDeciduous} from 'lucide-react';
import {cities,festivals,festivalFor,palaceConditions,scenes,seasonFor,seasons,skies,type City,type Festival,type SceneMode,type Season,type WeatherReading} from '@/lib/palace';
import PalaceArt from './palace-art';

type Settings={season:Season|'auto';theme:Festival|'auto';city:City};
const initial:Settings={season:'auto',theme:'auto',city:'zhuhai'};
const icons={spring:Flower2,summer:Sun,autumn:Leaf,winter:Snowflake};
const seasonNames={spring:'春樱',summer:'夏荫',autumn:'秋枫',winter:'冬雪'};
const themeNames={plain:'日常厨房',christmas:'圣诞厨房',lunar:'新春厨房',dragonboat:'端午厨房',qixi:'七夕厨房',midautumn:'中秋厨房',halloween:'万圣厨房'};
const storageKey='sl-palace-v1';
type Place={lat:number;lon:number};
export default function PalaceKitchen({day,recipes,fortune}:{day:string;recipes:()=>void;fortune:()=>void}){
  const [settings,setSettings]=useState<Settings>(initial),[ready,setReady]=useState(false);
  const [mode,setMode]=useState<SceneMode>('live'),[coords,setCoords]=useState<Place|null>(null);
  const [message,setMessage]=useState(''),[locating,setLocating]=useState(false),[retry,setRetry]=useState(0);
  const [forecast,setForecast]=useState<{key:string;reading?:WeatherReading;failed?:boolean}>({key:''});
  const [clock,setClock]=useState<number|null>(null);
  useEffect(()=>{
    try {const r=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(r)setSettings({season:r.season==='auto'||Object.hasOwn(seasons,r.season)?r.season:'auto',theme:r.theme==='auto'||Object.hasOwn(festivals,r.theme)?r.theme:'auto',city:Object.hasOwn(cities,r.city)?r.city:'zhuhai'});
    }catch{/* Browsers may disable storage. */}
    setReady(true);setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),60000);return ()=>clearInterval(timer);
  },[]);
  useEffect(()=>{if(ready){try{localStorage.setItem(storageKey,JSON.stringify(settings))}catch{/* Optional device preferences. */}}},[ready,settings]);
  const place=cities[settings.city],weatherKey=coords?'lat='+coords.lat+'&lon='+coords.lon:'city='+settings.city;
  useEffect(()=>{
    if(!ready)return;
    const controller=new AbortController();let last=0;
    async function refresh(){
      if(Date.now()-last<60000)return;last=Date.now();
      try{
        const r=await fetch('/api/weather?'+weatherKey,{signal:controller.signal});
        if(!r.ok)throw Error();
        const reading=await r.json() as WeatherReading;
        if(!Object.hasOwn(skies,reading.sky)||!Number.isFinite(reading.temperature)||!Number.isFinite(reading.time))throw Error();
        if(!controller.signal.aborted)setForecast({key:weatherKey,reading});
      }catch{if(!controller.signal.aborted)setForecast(prev=>({key:weatherKey,failed:true,reading:prev.key===weatherKey?prev.reading:undefined}))}
    }
    void refresh();const timer=setInterval(refresh,15*60000);
    const visible=()=>{if(document.visibilityState==='visible')void refresh()};
    document.addEventListener('visibilitychange',visible);
    return ()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
  },[ready,weatherKey,retry]);
  const locationName=coords?'定位附近':place[0];
  const measured=forecast.key===weatherKey?forecast.reading:undefined;
  const reading=measured&&clock&&Math.abs(clock-measured.time)<3*3600000?measured:null;
  const failed=forecast.key===weatherKey&&(forecast.failed||Boolean(measured&&!reading));
  const season=settings.season==='auto'?seasonFor(day,coords?.lat??place[1]):settings.season;
  const theme=settings.theme==='auto'?festivalFor(day):settings.theme;
  const conditions=palaceConditions(mode,reading,theme,false,season);
  const update=<K extends keyof Settings>(key:K,value:Settings[K])=>setSettings(old=>({...old,[key]:value}));
  function locate(){
    if(!navigator.geolocation){setMessage('此浏览器暂不支持定位，可以手动选择城市。');return}
    setLocating(true);setMessage('');
    navigator.geolocation.getCurrentPosition(p=>{
      setCoords({lat:Math.round(p.coords.latitude*4)/4,lon:Math.round(p.coords.longitude*4)/4});setMode('live');setLocating(false);
    },()=>{setLocating(false);setMessage('未取得位置，可以手动选择城市。')},{enableHighAccuracy:false,maximumAge:900000,timeout:10000});
  }
  const badge=mode!=='live'?scenes[mode]+'预览':reading?locationName+' · '+skies[reading.sky]+' '+Math.round(reading.temperature)+'°':failed?locationName+' · 季节窗景':locationName+' · 获取天气中';
  const WeatherIcon=mode==='live'&&reading&&!reading.daylight?Moon:CloudSun;
  return <section className={'castle-home castle-'+theme} aria-label="四季城堡厨房">
    <div className="castle-spread"><div className="castle-copy">
      <p className="castle-eyebrow"><Castle size={20}/> 食来运转 · 城堡厨房</p>
      <h1>今天，一起<br/><em>好好吃饭。</em></h1>
      <p className="castle-subtitle">挑一道想吃的菜，让厨房里飘起香气。</p>
      <div className="castle-actions"><button className="castle-primary" onClick={recipes}><BookOpen size={18}/>翻开菜谱</button><button className="castle-secondary" onClick={fortune}><Sparkles size={16}/>抽今日幸运菜</button></div>
    </div><div className="castle-stage"><PalaceArt season={season} theme={theme} {...conditions}/>
      <p className="castle-scene-tag"><WeatherIcon size={15}/>{badge}{conditions.fire&&<Flame size={15} aria-label="壁炉已点燃"/>}</p>
    </div></div>
    <div className="castle-toolbar">
      <div className="castle-season"><span className="castle-label"><TreeDeciduous size={16}/>窗外四季</span><div role="group" aria-label="切换窗外季节">{(Object.keys(seasons) as Season[]).map(s=>{const Icon=icons[s];return <button key={s} type="button" onClick={()=>update('season',s)} aria-pressed={season===s} className={'season-'+s}><Icon size={15}/>{seasonNames[s]}</button>})}</div></div>
      <div className="castle-theme-group" role="group" aria-label="厨房节日主题">{(['auto','plain','lunar','dragonboat','qixi','midautumn','halloween','christmas'] as const).map(t=>{const Icon={auto:Sparkles,plain:Castle,lunar:Gift,dragonboat:Sailboat,qixi:Heart,midautumn:Moon,halloween:Cat,christmas:TreePine}[t];return <button key={t} type="button" aria-pressed={settings.theme===t} onClick={()=>update('theme',t)}><Icon size={15}/>{t==='auto'?'跟随节日':themeNames[t]}</button>})}</div>
      <details className="castle-settings"><summary><SlidersHorizontal size={16}/> 窗景设置 <ChevronDown size={14}/></summary>
        <div className="palace-settings-body">
          <label><span><MapPin size={15}/>天气地点</span><select aria-label="天气地点" value={coords?'nearby':settings.city} onChange={e=>{setCoords(null);setMessage('');update('city',e.target.value as City);setMode('live')}}>{coords&&<option value="nearby">定位附近</option>}{(Object.keys(cities) as City[]).map(id=><option key={id} value={id}>{cities[id][0]}</option>)}</select></label>
          <label><span><CloudSun size={15}/>光影与天气</span><select aria-label="光影与天气" value={mode} onChange={e=>setMode(e.target.value as SceneMode)}>{(Object.keys(scenes) as SceneMode[]).map(m=><option value={m} key={m}>{scenes[m]}{m==='live'?'':'预览'}</option>)}</select></label>
          <div className="palace-settings-actions"><button onClick={locate} disabled={locating}><LocateFixed size={16}/>{locating?'获取位置中':'使用附近天气'}</button><button onClick={()=>{update('season','auto');setMode('live')}}>跟随当前季节</button>{failed&&<button onClick={()=>setRetry(v=>v+1)}>重试天气</button>}</div>
          <p>定位仅使用约 25 公里范围的网格查询天气，位置不保存在饭本中。</p>
          {reading&&<p>{locationName}天气有效时间 <time dateTime={new Date(reading.time).toISOString()}>{new Date(reading.time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time>（设备时间） · <a href={reading.source==='Open-Meteo'?'https://open-meteo.com/':'https://www.met.no/en'} target="_blank" rel="noreferrer">{reading.source}</a>。</p>}
          {failed&&<p role="status">{reading?'天气更新暂缓，显示最近一次有效数据。':'暂时无法取得天气。可以预览晴日、雨雪和节庆夜景。'}</p>}
          {message&&<p role="status">{message}</p>}
        </div>
      </details>
    </div>
  </section>
}
