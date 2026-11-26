import {calendarYear} from './calendar/calendar.mjs';

export const seasons = {spring:'春',summer:'夏',autumn:'秋',winter:'冬'} as const;
export const festivals = {plain:'日常',christmas:'圣诞',lunar:'春节'} as const;
export const skies = {clear:'晴',cloud:'多云',rain:'雨',snow:'雪',fog:'雾',storm:'雷雨'} as const;
export type Season = keyof typeof seasons;
export type Festival = keyof typeof festivals;
export type Sky = keyof typeof skies;
export type WeatherReading = {sky:Sky;temperature:number;daylight:boolean;time:number;source:'Open-Meteo'|'MET Norway'};
export const scenes = {live:'跟随天气',sun:'晴日',shower:'雨天',snowfall:'雪天',eve:'节庆夜景'} as const;
export type SceneMode = keyof typeof scenes;
export const cities = {
  zhuhai:['珠海',22.27,113.58],shenzhen:['深圳',22.54,114.06],guangzhou:['广州',23.13,113.26],
  beijing:['北京',39.90,116.41],shanghai:['上海',31.23,121.47],hangzhou:['杭州',30.27,120.16],
  chengdu:['成都',30.57,104.07],harbin:['哈尔滨',45.80,126.54],hongkong:['香港',22.32,114.17],
  taipei:['台北',25.03,121.57],singapore:['新加坡',1.35,103.82],sydney:['悉尼',-33.87,151.21],
  london:['伦敦',51.51,-.13],newyork:['纽约',40.71,-74.00],
} as const;
export type City = keyof typeof cities;
export const coldThreshold = 12;
export function seasonFor(date:string,latitude:number):Season {
  const month=Number(date.slice(5,7));
  const north:Season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
  return latitude>=0?north:({spring:'autumn',summer:'winter',autumn:'spring',winter:'summer'} as const)[north];
}
export function festivalFor(date:string):Festival {
  if(date.endsWith('-12-24')||date.endsWith('-12-25'))return 'christmas';
  const start=calendarYear(Number(date.slice(0,4))).find(event=>event.id==='spring-festival')?.date;
  const delta=(Date.parse(date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000;
  return delta>=-1&&delta<7?'lunar':'plain';
}
export function skyFromCode(code:number):Sky|null {
  if(code===0||code===1)return 'clear'; if(code===2||code===3)return 'cloud';
  if(code===45||code===48)return 'fog';
  if([71,73,75,77,85,86].includes(code))return 'snow';
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return 'rain';
  return [95,96,99].includes(code)?'storm':null;
}
export function palaceConditions(mode:SceneMode,reading:WeatherReading|null,theme:Festival,nightFallback:boolean,season:Season) {
  const sky:Sky=mode==='live'?reading?.sky||'clear':mode==='shower'?'rain':mode==='snowfall'?'snow':'clear';
  const night=mode==='live'?(reading?!reading.daylight:nightFallback):mode==='eve';
  const fire=mode==='live'?Boolean(reading&&reading.temperature<=coldThreshold):mode==='snowfall'||(mode==='eve'&&(reading?reading.temperature<=coldThreshold:season==='winter'));
  return {sky,night,fire,fireworks:night&&theme!=='plain'};
}
