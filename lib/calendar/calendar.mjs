// Hong Kong Observatory Gregorian–lunar conversion tables. These are civil
// dates of the Chinese calendar (UTC+8). A visitor's "today" is local time.
export const CALENDAR_SOURCE = 'https://www.hko.gov.hk/tc/gts/time/conversion1_text.htm';

// Each year's six non-leap lunar festivals, followed by its 24 actual solar-term days.
const observations = {
  2024: [["02-10","02-24","06-10","08-10","09-17","10-11"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
  2025: [["01-29","02-12","05-31","08-29","10-06","10-29"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
  2026: [["02-17","03-03","06-19","08-19","09-25","10-18"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
  2027: [["02-06","02-20","06-09","08-08","09-15","10-08"],[5,20,4,19,6,21,5,20,6,21,6,21,7,23,8,23,8,23,8,23,7,22,7,22]],
  2028: [["01-26","02-09","05-28","08-26","10-03","10-26"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
  2029: [["02-13","02-27","06-16","08-16","09-22","10-16"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
  2030: [["02-03","02-17","06-05","08-05","09-12","10-05"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
  2031: [["01-23","02-06","06-24","08-24","10-01","10-24"],[5,20,4,19,6,21,5,20,6,21,6,21,7,23,8,23,8,23,8,23,7,22,7,22]],
  2032: [["02-11","02-25","06-12","08-12","09-19","10-12"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
  2033: [["01-31","02-14","06-01","08-01","09-08","10-01"],[5,20,3,18,5,20,4,20,5,21,5,21,7,22,7,23,7,23,8,23,7,22,7,21]],
  2034: [["02-19","03-05","06-20","08-20","09-27","10-20"],[5,20,4,18,5,20,5,20,5,21,5,21,7,23,7,23,7,23,8,23,7,22,7,22]],
  2035: [["02-08","02-22","06-10","08-10","09-16","10-09"],[5,20,4,19,6,21,5,20,5,21,6,21,7,23,7,23,8,23,8,23,7,22,7,22]],
  2036: [["01-28","02-11","05-30","08-28","10-04","10-27"],[6,20,4,19,5,20,4,19,5,20,5,21,6,22,7,22,7,22,8,23,7,22,6,21]],
};
export const CALENDAR_YEARS = Object.freeze(Object.keys(observations).map(Number));

const lunarFestivals = [
  ['spring-festival','春节','new-year',['饺子','年糕','清蒸鲈鱼','莲藕排骨汤']],
  ['lantern','元宵节','lantern',['汤圆','酒酿圆子','百合莲子糖水']],
  ['dragon-boat','端午节','summer',['粽子','咸鸭蛋','绿豆沙']],
  ['qixi','七夕节','rose',['双人牛排','草莓蛋糕','玫瑰牛奶','银耳雪梨羹']],
  ['mid-autumn','中秋节','moon',['月饼','桂花糕','莲藕排骨汤']],
  ['double-ninth','重阳节','autumn',['重阳糕','栗子烧鸡','红枣银耳羹']]
];
const fixedFestivals = [
  ['new-year','元旦','01-01','new-year',['长寿面','年糕','番茄牛腩汤']],
  ['valentine','情人节','02-14','rose',['草莓蛋糕','黑椒牛排','巧克力布朗尼','苹果肉桂茶']],
  ['halloween','万圣节','10-31','pumpkin',['南瓜派','南瓜浓汤','百合南瓜汤']],
  ['christmas','圣诞节','12-25','christmas',['烤鸡','姜饼','香橙热红酒','无酒精香料热饮']],
  ['new-years-eve','跨年夜','12-31','midnight',['番茄牛腩汤','肉桂热红酒','无酒精香料热饮']]
];
const terms = [
  ['小寒',['山药排骨汤','姜枣茶']],['大寒',['萝卜羊肉汤','桂圆红枣茶']],
  ['立春',['春饼','百合莲子糖水']],['雨水',['菌菇鸡汤','银耳莲子羹']],
  ['惊蛰',['冰糖雪梨','雪梨百合汤']],['春分',['春卷','菌菇鸡汤']],
  ['清明',['青团','艾粄','清补凉']],['谷雨',['香椿拌豆腐','百合南瓜汤']],
  ['立夏',['茶叶蛋','绿豆沙']],['小满',['冬瓜汤','清补凉']],
  ['芒种',['酸梅汤','绿豆沙']],['夏至',['鸡丝凉面','酸梅汤']],
  ['小暑',['冬瓜汤','椰奶西米露']],['大暑',['清补凉','绿豆沙']],
  ['立秋',['莲藕排骨汤','银耳雪梨羹']],['处暑',['酸梅汤','百合南瓜汤']],
  ['白露',['银耳莲子羹','雪梨百合汤']],['秋分',['百合南瓜汤','莲藕排骨汤']],
  ['寒露',['冰糖雪梨','山药排骨汤']],['霜降',['番茄牛腩汤','红枣银耳羹']],
  ['立冬',['饺子','胡椒猪肚鸡']],['小雪',['姜枣茶','菌菇鸡汤']],
  ['大雪',['萝卜羊肉汤','桂圆红枣茶']],['冬至',['饺子','汤圆','萝卜羊肉汤']]
];

const pad = (n) => String(n).padStart(2, '0');
export function localDateKey(date = new Date()) {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
function event(id, name, date, kind, theme, menu, isFestival = kind !== 'term') {
  return {id, name, date, kind, theme, menu: [...menu], isFestival};
}
function priority(item) {
  return item.kind === 'birthday' ? 0 : item.isFestival ? 1 : 2;
}

export function calendarYear(year, birthday) {
  const recorded = observations[year];
  if (!recorded) return [];
  const [lunarDates, termDays] = recorded;
  const list = fixedFestivals.map(([id,name,day,theme,menu]) =>
    event(id, name, year + '-' + day, 'festival', theme, menu)
  );
  lunarFestivals.forEach(([id,name,theme,menu], index) => {
    list.push(event(id,name,year + '-' + lunarDates[index],'festival',theme,menu));
  });
  terms.forEach(([name,menu], index) => {
    const month = Math.floor(index / 2) + 1;
    const date = year + '-' + pad(month) + '-' + pad(termDays[index]);
    const season = ['spring','summer','autumn','winter'][Math.floor(((month + 9) % 12) / 3)];
    list.push(event('term-' + (index + 1),name,date,'term',season,menu,name === '清明' || name === '冬至'));
  });
  const firstWeekday = new Date(Date.UTC(Number(year), 10, 1)).getUTCDay();
  const thursday = 22 + ((4 - firstWeekday + 7) % 7);
  list.push(event('thanksgiving','感恩节',year + '-11-' + thursday,'festival','harvest',['烤火鸡','南瓜派','南瓜浓汤','苹果肉桂茶']));
  if (validDate(birthday)) {
    const anniversary = year + birthday.slice(4);
    // Feb 29 birthdays appear on their actual civil date in leap years.
    if (validDate(anniversary) && anniversary >= birthday) {
      list.push(event('birthday','生日',anniversary,'birthday','birthday',['长寿面','生日蛋糕','番茄鸡蛋面','红枣银耳羹']));
    }
  }
  return list.sort((a,b) => a.date.localeCompare(b.date) || priority(a) - priority(b) || a.id.localeCompare(b.id));
}

export function upcomingEvents(localDate = localDateKey(), birthday, limit = 4) {
  const today = localDate instanceof Date ? localDateKey(localDate) : localDate;
  if (!validDate(today) || !Number.isInteger(limit) || limit <= 0) return [];
  const year = Number(today.slice(0,4));
  if (!CALENDAR_YEARS.includes(year)) return [];
  const now = Date.parse(today + 'T00:00:00Z');
  return [year, year+1].flatMap(y => calendarYear(y, birthday)).filter(e => e.date >= today).slice(0,limit).map(e => ({
    ...e,
    daysUntil: (Date.parse(e.date + 'T00:00:00Z') - now) / 86400000
  }));
}
