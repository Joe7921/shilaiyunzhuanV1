import {useId} from 'react';
import geometry from '@/lib/palace-geometry.json';
import {seasons,festivals,skies,type Season,type Festival,type Sky} from '@/lib/palace';

function Firework({x,y,size,color}:{x:number;y:number;size:number;color:string}) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}><g className="sky-bloom" fill="none" stroke={color} strokeLinecap="round">{Array.from({length:15},(_,i)=><g key={i} transform={`rotate(${i*24})`}><path d="M0 -6 Q2 -14 0 -23 M0 -28 l-1 -4" strokeWidth={i%3?1.2:1.8}/><circle cy="-36" r="1" fill={color}/></g>)}</g></g>;
}
function Lantern({x,y,s}:{x:number;y:number;s:number}) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0v28" stroke="#a77643" strokeWidth="2"/>
    <rect x="-11" y="27" width="22" height="5" rx="2" fill="#e6ba68" stroke="#9d6950"/>
    <ellipse cy="53" rx="27" ry="23" fill="#de6961" stroke="#9c534b" strokeWidth="2"/>
    <ellipse cy="53" rx="16" ry="22" fill="none" stroke="#ed9c7b" strokeWidth="2"/><path d="M0 31v44" stroke="#f3b28b"/>
    <path d="M-10 76h20M0 78v9m-3 1-2 12m6-12v14m1-15 4 13" stroke="#cc9756" strokeWidth="3"/>
  </g>;
}
function ChristmasTrim() {
  return <g strokeLinecap="round">
    <path d="M754 129q123 88 227 7" fill="none" stroke="#57765a" strokeWidth="5"/>
    {Array.from({length:26},(_,i)=>{const t=i/25;const x=756+221*t,y=131+170*t*(1-t)+7*t;return <g key={i} transform={`translate(${x} ${y}) rotate(${24-50*t})`}><path d="M0 1q-1-11-14-16Q-12-4 0 1m0-1Q7-12 14-12Q12-2 0 1" fill={i%2?'#66856a':'#849779'}/>{i%5===1&&<><path d="M0 2v7" stroke="#ab884f"/><circle cy="11" r="4" fill={i%2?'#d47775':'#eac26d'} stroke="#ac8659"/></>}</g>})}
    <path d="m866 165-16-11q-8-2-5 7l7 9-7 10 18-8 9 16 3-16 13-6-7-8-13 7" fill="#ba635e" stroke="#92544f"/>
  </g>;
}
export default function PalaceArt({season,theme,sky,night,fire,fireworks}:{season:Season;theme:Festival;sky:Sky;night:boolean;fire:boolean;fireworks:boolean}){
  const id=useId().replace(/[^a-z0-9_-]/gi,'');const ref=(key:string)=>'url(#'+id+'-'+key+')';
  return <figure className="palace-art" data-season={season} data-theme={theme} data-sky={sky} data-night={night} data-fire={fire} data-fireworks={fireworks}>
    <svg viewBox={geometry.viewBox} role="img" aria-label={seasons[season]+'季的城堡厨房，'+festivals[theme]+'装饰。窗外'+skies[sky]+(night?'夜':'天')+'，橘猫正端出蛋包饭'+(fire?'，壁炉正燃烧':'')+(fireworks?'，天空绽放烟花':'')}>
    <defs><clipPath id={id+'-pane'}><path d={geometry.glassPath}/></clipPath>
      <radialGradient id={id+'-glow'}><stop stopColor="#ffc46d" stopOpacity=".8"/><stop offset=".5" stopColor="#ffa15d" stopOpacity=".35"/><stop offset="1" stopColor="#f2a35a" stopOpacity="0"/></radialGradient>
      <linearGradient id={id+'-dusk'} x2=".25" y2="1"><stop stopColor="#1f214c" stopOpacity=".93"/><stop offset=".49" stopColor="#514563" stopOpacity=".48"/><stop offset="1" stopColor="#403343" stopOpacity=".38"/></linearGradient>
    </defs>
    <image href="/images/palace/room.webp" width="1000" height="625" preserveAspectRatio="none"/>
    {night&&<rect width="1000" height="625" fill="#5a4364" opacity=".16"/>}
    <g clipPath={ref('pane')}>
      <image href={'/images/palace/'+season+'.webp'} x="200" y="44" width="304" height="324" preserveAspectRatio="xMidYMid slice"/>
      {(sky==='cloud'||sky==='fog'||sky==='rain'||sky==='storm'||sky==='snow')&&<g><rect x="198" y="40" width="312" height="331" fill={sky==='snow'?'#dce6ee':'#8792aa'} opacity={sky==='storm'?'.47':'.22'}/><path d="M183 111q19-18 38-13 10-24 38-17 19-26 45 0 23-4 37 15 25-3 41 18Z" fill="#e5e5ed" opacity=".8"/><path d="M368 129q24-20 41-13 13-22 32-15 14-14 34 4 21-7 39 19Z" fill="#d9e0e8" opacity=".78"/></g>}
      {night&&<><rect x="190" y="34" width="330" height="337" fill={ref('dusk')}/><path d="M330 70q-14 21 9 28-23 7-29-10-4-11 8-20 6-3 12 2" fill="#ffebae"/>{[0,1,2,3,4,5,6,7,8].map(i=><circle key={i} cx={239+i*28} cy={65+(i*19)%61} r={i%3===0?1.8:1.05} fill="#fff1c1"/>)}</>}
      {sky==='fog'&&<g fill="#eef0f2" opacity=".6"><path d="M189 166q56-12 107 0t122 0 98-4v13H190z"/><path d="M189 190q48-8 113 3t126 0 91-4v9H189z"/></g>}
      {(sky==='rain'||sky==='storm'||sky==='snow')&&<g className={'weather-particles '+(sky==='snow'?'snow':'rain')} fill="#fff9f2" stroke={sky==='snow'?'none':'#bed8ea'} strokeWidth="1.4" strokeLinecap="round">
        {Array.from({length:sky==='snow'?58:43},(_,i)=>{const x=203+(i*53)%312,y=20+(i*79)%349;return sky==='snow'?<circle key={i} cx={x} cy={y} r={1.1+(i%4)*.5}/>:<path key={i} d={`M${x} ${y}l-4 12`}/>})}</g>}
      {fireworks&&<g><Firework x={292} y={137} size={1.05} color="#ffcf9b"/><Firework x={421} y={99} size={.78} color="#ffd1dd"/></g>}
    </g>
    {theme==='christmas'&&<ChristmasTrim/>}
    {theme==='lunar'&&<g><Lantern x={185} y={92} s={.72}/><Lantern x={523} y={99} s={.72}/><path d="m853 135 19 17-19 17-18-17z" fill="#c96b60" stroke="#eec085" strokeWidth="2"/><path d="m852 143 8 9-8 9-8-9z" stroke="#f5cf82" strokeWidth="2" fill="none"/></g>}
    {fire&&<g><ellipse cx="883" cy="374" rx="98" ry="91" fill={ref('glow')}/><g className="hearth-flames">
      <path d="M843 404q-6-14 8-37 1 12 8 15-2-31 18-45-2 17 8 23 12-19 9-41 25 24 16 54 12-6 14-20 22 39 0 52-25 13-81-1Z" fill="#ef9260" stroke="#bd7053" strokeWidth="1.4"/>
      <path d="M857 404q-3-9 6-23 2 8 6 10-1-18 11-31 0 10 7 17 9-11 11-24 13 18 6 35 9-6 12-13 15 32-9 34Z" fill="#ffd27b"/>
      <path d="M880 407q-7-9 4-22 2 8 6 9 6-5 9-13 5 17-3 25Z" fill="#fff0b1"/></g></g>}
    </svg>
  </figure>
}
