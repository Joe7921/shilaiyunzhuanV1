import {personalities, type Personality, type Recipe} from './recipes';
import {isDessert} from './blindbox';

type Kind = Personality['id'];
type FlavorChoice = {
  label: string;
  kind: Kind;
  preference: string;
  match?: (recipe: Recipe) => boolean;
};
const taste = (re: RegExp) => (r: Recipe) => re.test(r.tastes.join('、'));
const dish = (re: RegExp) => (r: Recipe) => re.test([r.title,r.category,...r.tags].join('、'));
const ingredient = (re: RegExp) => (r: Recipe) => r.ingredients.some(i=>re.test(i.name));
const choice = (label:string, kind:Kind, preference:string, match?:FlavorChoice['match']):FlavorChoice =>
  ({label, kind, preference, match});

const flavorQuestions = [
  {question:'刚坐下来点菜，哪种味道最容易让你动筷？', options:[
    choice('锅里慢慢炖出来的鲜香','cozy','汤汁鲜香、慢慢炖入味的菜',dish(/炖|煲|汤|羹/)),
    choice('带一点辣、香气足的锅气','bold','香辣带劲、趁热上桌的菜',taste(/辣|麻/)),
    choice('清爽里带一点果酸','fresh','清爽微酸、吃起来明亮的味道',taste(/酸|果香|清爽/)),
    choice('刚出锅的葱香或蒜香','quick','葱蒜香气突出的家常菜',taste(/葱香|蒜香/)),
  ]},
  {question:'哪种口感最值得你多夹一筷子？',options:[
    choice('外皮酥脆，咬下去有声音','bold','外层酥脆',dish(/酥|脆|烤|煎|炸/)),
    choice('爽脆多汁，越嚼越清甜','fresh','爽脆多汁',ingredient(/黄瓜|莲藕|彩椒|甜椒|豆芽|莴笋/)),
    choice('软糯绵密，用勺子就能吃','cozy','软糯绵密',dish(/糯|泥|羹|浓汤|粥|炖/)),
    choice('滑嫩顺口，每一勺都好入口','quick','滑嫩顺口',dish(/蒸蛋|炒蛋|布丁|布甸|豆腐|奶冻/)),
  ]},
  {question:'同一桌家常菜，你想先给碗里盛什么？',options:[
    choice('热汤配饭，边吃边暖手','cozy','热汤或炖菜配饭',dish(/汤|炖|煲|羹/)),
    choice('一小盘拌菜，能尝到食材原味','fresh','清拌时蔬',dish(/拌|沙拉|凉菜/)),
    choice('一碗拌好料的面，端起来就开吃','quick','一碗上桌的面食',dish(/面|乌冬|河粉|米线/)),
    choice('浓酱裹着的下饭菜，拌两口米饭','bold','酱香浓郁的下饭菜',dish(/酱|红烧|照烧|咖喱|下饭菜/)),
  ]},
  {question:'冰箱里挑一样当今天的主角，你更想选？',options:[
    choice('鸡蛋，煎炒蒸都能安排','quick','鸡蛋料理',ingredient(/鸡蛋|蛋液/)),
    choice('菌菇，煮出一锅鲜味','cozy','菌菇料理',ingredient(/菇|蘑菇|菌菇/)),
    choice('绿叶菜，清炒就很香','fresh','清炒绿叶菜',ingredient(/菠菜|小白菜|菜心|青菜|生菜|油麦菜/)),
    choice('豆腐，让它吸足酱汁','bold','入味的豆腐',ingredient(/豆腐/)),
  ]},
  {question:'饭桌上给你一个小碟，你会用来装？',options:[
    choice('一点酸香汁，蘸一口就够','fresh','清酸口的调味',taste(/酸|清爽/)),
    choice('辣椒或花椒，闻着就开胃','bold','带辣椒或花椒的香气',taste(/辣|麻/)),
    choice('温热的原汤，让鲜味留久一点','cozy','原汤的鲜味',dish(/汤|羹|炖/)),
    choice('葱油，直接拌到饭面里','quick','葱香拌饭拌面',taste(/葱香/)),
  ]},
  {question:'留出一小碟的位置，你想把它给谁？',options:[
    choice('刚烤过的酥香小点','bold','烤得酥香的小点',dish(/酥|曲奇|软饼|饼干|烘焙/)),
    choice('切开就能吃的新鲜水果','fresh','带果香的小食',taste(/果香|果酸/)),
    choice('热乎乎的糖水或甜羹','cozy','热糖水或甜羹',dish(/糖水|甜羹|银耳|雪梨|莲子/)),
    choice('留给正餐，我更想吃咸口','quick','咸口小食',r=>!r.alcohol&&taste(/咸|葱香|蒜香/)(r)),
  ]},
  {question:'自己掌勺时，哪种做饭节奏最像你？',options:[
    choice('十几分钟收工，锅碗越少越好','quick','二十分钟左右的快手菜',r=>r.time<=20),
    choice('一边做别的，一边等小锅慢炖','cozy','可以慢慢炖煮的一锅菜',dish(/炖|汤|煲|粥/)),
    choice('乐意等一会儿，把食物煎得焦香','bold','煎烤出香气的菜',dish(/煎|烤|焗/)),
    choice('洗切拌好，让食材保留爽口的感觉','fresh','清爽的凉拌菜',dish(/凉菜|沙拉|拌/)),
  ]},
];

type HabitChoice={label:string; tip:string; priority:number};
const habit=(label:string,tip:string,priority:number):HabitChoice=>({label,tip,priority});
const habitQuestions = [
  {question:'想想最近一周，你吃正餐时的蔬菜通常在哪儿？',options:[
    habit('大多有一份单独的蔬菜','保留正餐有蔬菜的习惯，这周把常吃的一种换成另一种颜色。',1),
    habit('面或盖饭里带几口配菜','下次点面或盖饭，单加一份自己能吃的蔬菜。配菜多一点，这碗饭就更完整。',5),
    habit('忙起来常常顾不上蔬菜','先从一天的一顿开始，点餐时先选蔬菜，或在冰箱留一份容易处理的时蔬。',6),
    habit('不太固定，没怎么留意','从下一顿观察起，看看主食旁边有没有一份蔬菜。',2),
  ]},
  {question:'平时吃主食，哪种情况最多？',options:[
    habit('大多是白米饭、白面条','可以把一部分精制主食换成自己能吃的全谷物，先从喜欢的口感试起。',4),
    habit('经常换着吃全谷、薯类和米面','继续轮换主食，在不同餐次调整粗细和软硬，选自己喜欢的搭配。',1),
    habit('经常用点心顶掉一顿正餐','喜欢的点心可以留作加餐。先给忙的时候备一顿有主食、蔬菜和蛋白质食物的简餐。',6),
    habit('有时忙到漏掉正餐的主食','给最容易漏掉的那顿留一份方便取用的主食，再配一份菜。',5),
  ]},
  {question:'正餐里提供蛋白质的食物，你通常怎样安排？',options:[
    habit('总点同一种自己爱吃的','在自己能吃的蛋白质食物里，再挑一种轮换，比如把两顿相同的配菜错开。',3),
    habit('按自己的饮食习惯，换几种来吃','把已经习惯轮换的蛋白质食物保留下来，配上主食和蔬菜就是一顿饭的起点。',1),
    habit('主要选豆类或豆制品','可以在自己能吃的豆类和豆制品里换花样，再配谷薯和蔬菜。',2),
    habit('忙的时候，往往只有一碗饭或面','下次吃一碗饭或面时，给它加一份符合个人忌口的蛋白质食物，再添些蔬菜。',5),
  ]},
  {question:'想喝点东西时，手最常伸向哪一杯？',options:[
    habit('白水或无糖茶','白水或无糖茶可以继续当日常饮品，出门时给自己带一杯。',1),
    habit('奶茶、汽水等甜饮','保留最喜欢的甜饮，平时选小杯或少糖，把其中一次换成白水。',5),
    habit('果汁或果茶','想吃水果时可以直接选能吃的完整水果，日常解渴让白水多上场。',4),
    habit('经常忘了喝水','把水杯放到手边，给常常忘记喝水的那段时间留一次喝水机会。',4),
  ]},
  {question:'吃味道比较浓的菜时，你平时怎么用酱汁？',options:[
    habit('常常把汤汁也拌进饭里','保留喜欢的酱香，把酱汁分开放，尝过菜再决定蘸多少。',4),
    habit('先尝一口，觉得需要才蘸','先尝后蘸的习惯可以保留。做菜时分次调味，也更容易掌握咸淡。',1),
    habit('更爱香气，酱汁通常只蘸一点','继续少量蘸汁，用合口味的香料提升香气，调味也能有层次。',1),
    habit('说不准，主要看当天的菜','下次试一次把蘸料放在小碟里，先尝原味再决定加多少。',2),
  ]},
];

export const quizQuestions = [...flavorQuestions,...habitQuestions];
export const tasteQuestionCount = flavorQuestions.length;
export const guideUrl = 'https://wjw.fj.gov.cn/ztzl/jkjy/jkzgxd/202206/t20220615_5930367.htm';

export function validQuizAnswers(value:unknown):value is number[] {
  return Array.isArray(value) && value.length===quizQuestions.length &&
    quizQuestions.every((q,i)=>Number.isInteger(value[i]) && value[i]>=0 && value[i]<q.options.length);
}

export function tasteReport(answers:number[],eligible:Recipe[]) {
  if(!validQuizAnswers(answers)) return null;
  const picks=flavorQuestions.map((q,i)=>q.options[answers[i]]);
  const counts:Record<Kind,number>={cozy:0,bold:0,fresh:0,quick:0};
  for(const p of picks) counts[p.kind]++;
  // On ties the visitor's first direct taste choice has precedence.
  const winner=picks.reduce((best,p)=>counts[p.kind]>counts[best]?p.kind:best,picks[0].kind);
  const personality=personalities.find(p=>p.id===winner)!;
  const snacks=picks[5];
  const plan=eligible.filter(r=>!r.alcohol && (answers[5]!==3 || !isDessert(r))).map(r=>{
    const matches=picks.filter(p=>p.match?.(r));
    const score=matches.length*3 + (picks[0].match?.(r)?2:0) + (personality.recipeIds.includes(r.id)?1:0);
    return {r,score,reason:matches.slice(0,2).map(p=>p.preference).join('、')};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.r.time-b.r.time||a.r.id.localeCompare(b.r.id));
  const habits=habitQuestions.map((q,i)=>q.options[answers[flavorQuestions.length+i]]);
  const tips=[...habits].sort((a,b)=>b.priority-a.priority).slice(0,3);
  return {personality,summary:'你偏爱'+picks[0].preference+'，喜欢'+picks[1].preference+'的口感。',foodStyle:'一桌菜里，你会先选'+picks[2].preference+'。'+(answers[5]===3?'比起甜点，你更愿意把胃口留给咸口。':'饭后的小碟里，你更想留一份'+snacks.preference+'。'),tips,recommendations:plan.slice(0,3)};
}
