import {useId} from 'react';
import scenes from '@/lib/palace-scenes.json';
import {seasons,skies,type Season,type Festival,type Sky} from '@/lib/palace';

const descriptions={
  everyday:'玫瑰色窗帘下，橘猫正给小鸭盛南瓜汤',
  christmas:'一棵挂满彩灯的大圣诞树，树下堆着礼物，桌上摆着姜饼',
  lunar:'两盏大红灯笼照着团圆饭桌，家人们在蒸鱼旁包饺子',
};

function Firework({x,y,color,delay}:{x:number;y:number;color:string;delay:number}) {
  return <g transform={`translate(${x} ${y})`}><g className="sky-bloom" style={{animationDelay:delay+'s'}} fill="none" stroke={color} strokeLinecap="round">
    {Array.from({length:16},(_,i)=><g key={i} transform={`rotate(${i*22.5})`}><path d="M0 -6 Q2 -14 0 -24 M0 -28 l-1 -3" strokeWidth="1.7"/><circle cy="-35" r="1.2" fill={color}/></g>)}
  </g></g>;
}

function Atmosphere({season,sky,night}:{season:Season;sky:Sky;night:boolean}){
  const wet=sky==='rain'||sky==='storm';
  return <>
    <g className="palace-clouds" opacity={sky==='clear'?'.34':'.73'} fill={night?'#d5cde6':'#fff3e4'}>
      <path d="M-12 83q20-13 30-8 7-15 24-11 9-19 31-9 17 0 22 10 19-2 30 10z"/>
      <path d="M276 78q18-13 34-9 12-17 28-11 19-13 32 4 18-4 33 10z"/>
    </g>
    {sky!=='clear'&&<rect width="420" height="300" fill={sky==='snow'?'#e5edf3':'#8490a5'} opacity={sky==='storm'?'.45':'.2'}/>}
    {sky==='fog'&&<g className="palace-clouds" opacity=".52" fill="#eff0ec"><path d="M-40 148q72-14 152 0t159 0 173-5v13H-40zM-40 179q84-8 156 0t173 1 157-5v9H-40z"/></g>}
    {(wet||sky==='snow')&&<g className={'weather-particles '+(wet?'rain':'snow')} stroke={wet?'#c0daee':'none'} strokeWidth="1.5" strokeLinecap="round" fill="#fffaf2">
      {Array.from({length:64},(_,i)=>{const x=(i*61)%442-10,y=(i*83)%338-20;return wet?<path key={i} d={`M${x} ${y}l-4 12`}/>:<circle key={i} cx={x} cy={y} r={1.3+(i%4)*.42}/>})}
    </g>}
    {!wet&&sky!=='snow'&&(season==='spring'||season==='autumn'||(season==='summer'&&night))&&<g fill={season==='spring'?'#ffc5d6':season==='autumn'?'#c58444':'#ffed9c'}>{Array.from({length:12},(_,i)=><g key={i} transform={`translate(${(i*73+17)%415} ${60+(i*31)%175})`}><ellipse className="palace-petal" rx={season==='summer'?1.7:3.4} ry="1.65" style={{animationDelay:-(i%7)+'s'}}/></g>)}</g>}
  </>;
}

export default function PalaceArt({season,theme,sky,night,fire,fireworks}:{season:Season;theme:Festival;sky:Sky;night:boolean;fire:boolean;fireworks:boolean}){
  const id=useId().replace(/[^a-z0-9_-]/gi,'');
  const ref=(key:string)=>'url(#'+id+'-'+key+')';
  const room=theme==='plain'?'everyday':theme;
  const {window:win,flame,lights,steam}=scenes[room];
  return <figure className="palace-art" data-season={season} data-theme={theme} data-sky={sky} data-night={night} data-fire={fire} data-fireworks={fireworks}>
    <svg viewBox="0 0 1000 625" role="img" aria-label={seasons[season]+'季的城堡厨房，'+descriptions[room]+'。窗外'+skies[sky]+(night?'夜':'天')+(fire?'，壁炉正燃烧':'')+(fireworks?'，天空绽放烟花':'')}>
      <defs>
        <radialGradient id={id+'-glow'}><stop stopColor="#ffdf8a" stopOpacity=".9"/><stop offset=".48" stopColor="#ffab62" stopOpacity=".42"/><stop offset="1" stopColor="#f79d50" stopOpacity="0"/></radialGradient>
        <linearGradient id={id+'-dusk'} x1="0" x2=".2" y2="1"><stop stopColor="#252650" stopOpacity=".94"/><stop offset=".52" stopColor="#554467" stopOpacity=".6"/><stop offset="1" stopColor="#51445e" stopOpacity=".4"/></linearGradient>
      </defs>
      <rect width="1000" height="625" fill="#fde3c9"/>
      <svg x={win.x-2} y={win.y-2} width={win.width+4} height={win.height+4} viewBox="0 0 420 300" preserveAspectRatio="none" overflow="hidden">
        <image href={'/images/palace/'+season+'.webp'} width="420" height="300" preserveAspectRatio="xMidYMid slice"/>
        {night&&<><rect width="420" height="300" fill={ref('dusk')}/><path d="M159 27q-16 20 7 27-22 7-27-10-3-12 8-18 6-3 12 1" fill="#fff0ae"/>{Array.from({length:16},(_,i)=><circle key={i} cx={22+i*24} cy={15+(i*29)%72} r={i%3?1:1.6} fill="#fff3c5"/>)}</>}
        <Atmosphere season={season} sky={sky} night={night}/>
        {fireworks&&<><Firework x={125} y={101} color="#ffdd9e" delay={0}/><Firework x={292} y={76} color="#ffc5d7" delay={-2.1}/></>}
      </svg>
      <image href={'/images/palace/'+room+'.webp'} width="1000" height="625" preserveAspectRatio="none"/>
      {night&&<rect width="1000" height="625" fill="#684655" opacity=".085"/>}
      {lights.map(([x,y],i)=><g key={i} className="palace-fairy-light" style={{animationDelay:-(i%6)*.64+'s'}}><circle cx={x} cy={y} r={room==='lunar'?12:7} fill={ref('glow')}/><circle cx={x} cy={y} r="1.45" fill="#fff4bc"/></g>)}
      {room==='lunar'&&scenes.lunar.lanterns.map(([x,y])=><ellipse key={x} cx={x} cy={y} rx="29" ry="33" fill={ref('glow')} className="palace-lantern-glow"/>)}
      {steam.map(([x,y],i)=><g key={x} transform={`translate(${x} ${y})`}><path className="palace-steam" style={{animationDelay:-i*1.3+'s'}} d="M0 0c-7-9 7-12 2-22s-3-13 0-17" fill="none" stroke="#fff8e8" strokeWidth="3.2" strokeLinecap="round"/></g>)}
      {fire&&<svg x={flame.x-6} y={flame.y-4} width={flame.width+12} height={flame.height+10} viewBox="0 0 100 85" preserveAspectRatio="none" overflow="visible">
        <ellipse cx="51" cy="62" rx="80" ry="69" fill={ref('glow')}/><g className="hearth-flames"><path d="M9 76C-4 58 18 42 17 28c7 5 9 13 10 18C32 31 48 21 46 4c22 15 12 34 17 42 8-8 14-17 11-28 20 17 9 38 12 41 6-4 9-13 9-16 7 36-6 40-46 39C27 82 15 82 9 76Z" fill="#ee8b55"/><path d="M23 77c-6-8 0-19 8-28 1 8 3 12 7 14 5-14 17-21 17-33 12 12 6 26 8 32 8-5 12-12 13-17 10 22 4 36-20 36Z" fill="#ffce76"/><path d="M42 77c-1-8 6-13 9-21 3 5 2 9 7 12l6-7c4 11 0 18-6 19Z" fill="#fff3af"/></g>
      </svg>}
    </svg>
  </figure>;
}
