import {calendarYear} from '../calendar/calendar.mjs';
import {seasonOf} from '../astro';
import type {Recipe} from '../recipes';
import {seasonalGuide,type SeasonName} from './nutrition';

const termsBySeason:Record<SeasonName,string[]> = {
  春:['立春','雨水','惊蛰','春分','清明','谷雨'],
  夏:['立夏','小满','芒种','夏至','小暑','大暑'],
  秋:['立秋','处暑','白露','秋分','寒露','霜降'],
  冬:['立冬','小雪','大雪','冬至','小寒','大寒']
};
export function termSeason(term:string|undefined,day:string):SeasonName{
  return (Object.entries(termsBySeason).find(([,terms])=>term&&terms.includes(term))?.[0] as SeasonName)||seasonOf(day);
}
export function seasonalContext(day:string){
  const year=Number(day.slice(0,4));
  const term=[...calendarYear(year-1),...calendarYear(year)].filter(e=>e.kind==='term'&&e.date<=day).at(-1);
  const season=termSeason(term?.name,day);
  return {season,term,guide:seasonalGuide(season,term?.name)};
}
export const traditionalGroups=['清热','润燥','温补'] as const;
export type SeasonalGroup=typeof traditionalGroups[number];
const groupSeries:Record<SeasonalGroup,RegExp>={清热:/夏日清凉/,润燥:/润喉糖水|秋日滋润/,温补:/冬日暖胃|暖身热饮/};
export function traditionalDishes(pool:Recipe[],group:SeasonalGroup){return pool.filter(r=>r.series&&groupSeries[group].test(r.series)&&!r.alcohol)}
export function seasonalFoods(pool:Recipe[],season:SeasonName){
  const options=[...seasonalGuide(season).foods];
  if(season==='春')options.push({name:'春菠菜',aliases:['菠菜'],selection:'选叶片舒展、叶柄饱满的一把，摘掉压伤的叶片再洗。',tradition:'春季常用嫩菠菜快炒或入汤。',reason:'嫩叶下锅很快就软，适合工作日晚餐。'});
  return options.map(food=>({...food,matches:pool.filter(r=>r.seasons.includes(season)&&r.ingredients.some(i=>[food.name,...food.aliases].some(n=>i.name.includes(n))))})).filter(f=>f.matches.length);
}
const escapeText=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function foldLine(value:string){
 const rows:string[]=[];const encoder=new TextEncoder();let bytes=0,line='';
 for(const ch of value){const n=encoder.encode(ch).length;if(bytes+n>75){rows.push(line);line=' ';bytes=1}line+=ch;bytes+=n}
 return [...rows,line].join('\r\n');
}
export function seasonCalendar(day:string,pool:Recipe[],siteUrl:string){
 const year=Number(day.slice(0,4));
 const terms=[...calendarYear(year),...calendarYear(year+1)].filter(e=>e.kind==='term'&&e.date>=day).slice(0,24);
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
 const events=terms.flatMap((t,index)=>{
  const season=termSeason(t.name,t.date),food=seasonalFoods(pool,season),choices=food.flatMap(f=>f.matches);
  const dish=choices[index%Math.max(1,choices.length)];
  if(!dish)return [];
  const date=t.date.replace(/-/g,'');const title=t.name+' · '+dish.title;
  return [['BEGIN:VEVENT','UID:term-'+date+'@shilai-yunzhuan.joe7921.chatgpt.site','DTSTAMP:'+stamp,'DTSTART:'+date+'T090000','DTEND:'+date+'T091000','SUMMARY:'+escapeText(title),'DESCRIPTION:'+escapeText(seasonalGuide(season,t.name).termNote+' 推荐做'+dish.title+'，约'+dish.time+'分钟。'),'URL:'+siteUrl+'/#planner/seasonal','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:'+escapeText(title),'END:VALARM','END:VEVENT']];
 });
 return {count:events.length,content:['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Shilai Yunzhuan//Seasonal kitchen//ZH-CN','CALSCALE:GREGORIAN',...events.flat(),'END:VCALENDAR'].map(foldLine).join('\r\n')+'\r\n'};
}
