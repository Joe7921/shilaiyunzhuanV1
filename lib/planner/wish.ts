// Deterministic text recipes. Prices are estimates for the quantities consumed, not package prices.
export type WishInput = {text:string; budget:number; people:number; avoid:string[]; tools:string[]; excludes?:string[]};
type Color = 'red'|'yellow'|'green'|'orange'|'white';
type Ingredient = {name:string; amount:number; unit:string};
export type WishSubstitution = {from:string; to:string; amount:number; unit:string; recipeId:string; estimatedCost:number; steps:string[]};
export type WishRecipe = {
  id:string; title:string; description:string; color:Color; colorName:string; luckyIngredient:string;
  time:number; difficulty:'简单'; servings:number; kcal:number; tags:string[]; allergens:string[];
  ingredients:Ingredient[]; steps:string[]; tip:string; image:string; aliases:string[]; cuisine:string;
  category:string; tastes:string[]; seasons:string[]; festivals:string[]; tools:string[]; vegetarian:boolean;
  imageCredit:string; kcalBasis:string; estimatedCost:number; wishTags:string[]; source:'wish'; substitutions:WishSubstitution[];
};
export type WishResult = {status:'ok'|'unavailable'; recipes:WishRecipe[]; gaps:string[]; assumptions:string[]};
type Food = {name:string; short:string; unit:string; price:number; energy:number; aliases:string[]; allergens:string[]; color:Color};
const foods:Record<string,Food> = {};
// CNY and kcal per 100 g, 100 ml, or 100 eggs respectively.
function food(id:string,name:string,short:string,price:number,energy:number,color:Color,aliases:string[]=[],allergens:string[]=[],unit='克'){
  foods[id]={name,short,unit,price,energy,color,aliases,allergens};
}
food('cuc','黄瓜','黄瓜',0.55,16,'green',['青瓜']);
food('tom','番茄','番茄',0.75,18,'red',['西红柿']);
food('pep','甜彩椒','甜椒',1.6,26,'red',['甜椒','灯笼椒','青椒','红椒','辣椒']);
food('chick','熟鹰嘴豆罐头（仅豆、水、盐，沥干）','鹰嘴豆',1.9,145,'yellow',['鹰嘴豆','豆类']);
food('corn','即食甜玉米粒（原味熟制）','玉米',1.35,86,'yellow',['玉米','粟米']);
food('peas','即食熟青豌豆（原味罐装）','青豌豆',1.4,78,'green',['豌豆','豆类']);
food('tofu','北豆腐','豆腐',0.65,85,'white',['豆腐','豆类','黄豆','豆制品'],['大豆']);
food('eggs','鸡蛋','鸡蛋',100,72*100,'yellow',['鸡蛋','鸡子','蛋类'],['蛋'],'个');
food('carrot','胡萝卜','胡萝卜',0.42,41,'orange',['红萝卜']);
food('sweet','红薯','红薯',0.48,86,'orange',['地瓜','番薯','甘薯']);
food('pot','土豆','土豆',0.4,77,'yellow',['马铃薯','洋芋']);
food('mush','鲜香菇','香菇',1.3,34,'white',['香菇','菇类','菌菇','蘑菇']);
food('cabb','大白菜','白菜',0.35,17,'white',['白菜','菜叶']);
food('pump','去皮南瓜','南瓜',0.48,26,'orange',['南瓜','倭瓜']);
food('zuc','西葫芦','西葫芦',0.65,17,'green',['西葫芦','小瓜']);
food('rice','大米','米',0.55,360,'white',['大米','米饭','白米','谷物']);
food('nood','干细米粉（仅大米和水）','米粉',1.1,355,'white',['米粉','米线','大米','谷物']);
food('oil','纯菜籽油','菜籽油',1.7,884,'yellow',['食用油','油脂','植物油']);
food('salt','盐','盐',0.2,0,'white',['钠','食盐']);
food('lemon','柠檬汁','柠檬',2.4,22,'yellow',['柠檬','柑橘'],[],'毫升');
food('lime','青柠汁','青柠',2.8,25,'green',['青柠','柠檬','柑橘'],[],'毫升');
food('vine','纯米醋（仅大米、水）','米醋',1.2,20,'white',['醋','大米'],[],'毫升');
food('cumin','孜然粉','孜然',8,375,'orange',['孜然','香料']);
food('paprika','甜红椒粉','红椒',7,282,'red',['辣椒','红椒','甜椒','香料']);
food('plain','清水','水',0,0,'white',[],[],'毫升');
food('yog','原味无糖酸奶','酸奶',1.8,64,'white',['牛奶','奶制品','乳制品','酸乳'],['奶']);
food('soy','原味无糖豆乳酸奶','豆乳酸奶',3.1,48,'white',['黄豆','豆类','豆制品','豆奶'],['大豆']);
food('apple','苹果','苹果',1.1,52,'red',[]);
food('banana','香蕉','香蕉',0.85,89,'yellow',[]);
food('pear','梨','香梨',0.9,57,'white',['香梨','雪梨']);
food('oats','可直接食用的原味即食燕麦片','燕麦',1.2,375,'yellow',['燕麦','麦片','谷物','麸质'],['燕麦','含麸质谷物']);
const colors:Record<Color,string>={green:'青瓜绿',red:'番茄红',yellow:'谷穗金',orange:'南瓜橙',white:'米白色'};
type Qty=[string,number];
type Method='cold'|'pot'|'pan'|'bake';
type Draft = {family:string; swap:string; ids:string[]; portions:Qty[]; title:string; desc:string; category:string; tastes:string[];
  tags:string[]; method:Method; time:number; steps:string[]; tip:string};
const ready='只用可开封即食的熟制品，按包装提示沥水；标明需加热的产品不适合这道冷食。';
function drafts(people:number):Draft[]{
  const all:Draft[]=[];
  const run=(base:Draft)=>all.push(base);
  for(const veg of ['cuc','tom','pep'])for(const bean of ['chick','corn','peas'])for(const acid of ['lemon','vine']){
    const v=foods[veg].short,b=foods[bean].short,a=foods[acid].short;
    run({family:'salad',swap:'熟配料',ids:[veg,bean,acid],portions:[[veg,110],[bean,85],[acid,7],['oil',3],['salt',0.45]],
      title:a+v+'拌'+b,desc:'脆口蔬菜和沥干的熟豆谷，用一小碗酸汁拌开。',category:'凉菜',tastes:['酸香','清爽'],tags:['开胃','清爽','宿舍','免火','亲子','下酒','素食','低预算'],method:'cold',time:10+Math.ceil(people/4),
      steps:['洗净'+v+'，擦干后切成约一厘米小丁；亲子同做时由成人处理刀具。',b+'选开封即食款，按标签沥干、冲洗。给孩子做时将豆粒或玉米粒压扁，按咀嚼能力再切细。','将'+a+'、盐、菜籽油搅匀，拌入蔬菜和熟配料。静置两分钟再分碗；切开的食材尽快冷藏。'],tip:ready});
  }
  for(const veg of ['carrot','pump','zuc'])for(const extra of ['corn','peas']) {
    const v=foods[veg].short,e=foods[extra].short;
    run({family:'congee',swap:'蔬菜',ids:[veg,extra],portions:[['rice',45],[veg,60],[extra,35],['plain',360],['salt',0.35]],
      title:v+e+'米粥',desc:'从生米慢煮，米粒开花时再拌入熟制配料，适合分成小碗。',category:'主食',tastes:['清甜','清淡'],tags:['清爽','亲子','素食','低预算'],method:'pot',time:38+Math.ceil(people/2),
      steps:['大米淘净；'+v+'洗净切半厘米小丁。将即食'+e+'沥干，给孩子的份量可提前压碎。','米、水和菜丁入锅，加热至沸，搅动让米离开锅底，再转小火留缝煮二十五至三十分钟，间或搅底。用量较多时分锅。','米粒软烂后加入熟'+e+'，继续轻沸三分钟再加盐。晾至适口温度，按孩子咀嚼能力压软分碗。'],tip:'用可留缝排汽的锅。用电饭锅时选煮粥模式并遵守厂家粥量线；程序时间按机型为准。'});
  }
  for(const veg of ['mush','tom','cabb'])for(const prot of ['eggs','tofu']){
    const v=foods[veg].short,p=foods[prot].short;
    run({family:'soup',swap:'主料',ids:[veg,prot],portions:[['nood',50],[veg,80],[prot,prot==='eggs'?1:90],['plain',380],['oil',2],['salt',0.6]],
      title:v+p+'细米粉汤',desc:'一锅煮出热汤和主食，蔬菜的鲜味留在汤里。',category:'主食',tastes:['鲜香','清淡'],tags:['开胃','亲子','低预算',...(prot==='tofu'?['素食']:[])],method:'pot',time:20+Math.ceil(people/2),
      steps:['选标注约三至五分钟煮熟的干细米粉。'+v+'洗净切薄片；'+(prot==='eggs'?'鸡蛋磕入碗中打散。':'北豆腐沥水切小方块。'),
      '锅中加菜籽油和蔬菜小火翻动一分钟，再倒清水煮开。'+(prot==='tofu'?'加入豆腐，':'')+'让汤轻沸五分钟至菜软。',
      '加入细米粉，按包装时长煮到中心无硬芯。'+(prot==='eggs'?'把蛋液沿汤面缓慢淋入，待蛋花全部凝固后，让汤再煮开。':'确认豆腐已热透。')+'加盐分碗，给孩子吃时将米粉剪短。'],tip:'干米粉的粗细会改变煮制时长，以包装说明和无硬芯为准。'});
  }
  for(const veg of ['pot','sweet','carrot'])for(const spice of ['cumin','paprika']){
    const v=foods[veg].short,s=foods[spice].short;
    run({family:'wedges',swap:'根茎',ids:[veg,spice],portions:[[veg,170],['oil',4],[spice,0.65],['salt',0.5]],
      title:s+'烤'+v+'角',desc:'根茎切成相同粗细，香料薄薄裹在上面，烤到表面略焦。',category:'小吃',tastes:['香烤','咸香'],tags:['下酒','素食','低预算','亲子'],method:'bake',time:35+Math.ceil(people/3)*4,
      steps:['将烤箱或空气炸锅预热到 195°C。成人处理刀具：'+v+'去皮切约一厘米宽的条或小角；擦干表面。','把油、盐、'+s+'和菜条拌匀；单层铺开，不能堆叠。人多时分批烤。','以 195°C 烤十五分钟，翻面后再烤五至十二分钟。边缘金黄、叉子能穿透中心即可；颜色过深时提前降温。'],tip:'不同机型和装篮量会影响时长；亲子同做时由成人收取热烤盘。'});
  }
  for(const fruit of ['apple','banana','pear'])for(const dairy of ['yog','soy']){
    const f=foods[fruit].short,d=foods[dairy].short;
    run({family:'cups',swap:'水果',ids:[fruit,dairy],portions:[[fruit,85],[dairy,120],['oats',15]],title:f+d+'燕麦杯',
      desc:'水果和即食燕麦分层装杯，水果提供甜味。',category:'甜品',tastes:['果香','清甜'],tags:['清爽','宿舍','免火','亲子','低预算',...(dairy==='soy'?['素食']:[])],method:'cold',time:12+Math.ceil(people/4),
      steps:[f+(fruit==='banana'?'剥皮':'洗净去核')+'切小丁；孩子可用勺子将果肉压软，由成人处理刀具。','取标注可直接食用的原味即食燕麦片，用一半'+d+'拌匀，静置五分钟。','杯中依次放燕麦、果丁和余下'+d+'。趁凉食用，未吃完的部分加盖冷藏。'],tip:'只使用可直接食用的燕麦片。乳或大豆过敏者应核对对应酸奶及燕麦包装上的交叉接触提示。'});
  }
  return all;
}
const themes:Record<string,RegExp>={
  '开胃':/开胃|胃口|酸香|酸爽/,'清爽':/清爽|清新|解腻|清淡/,'宿舍':/宿舍|寝室/,
  '免火':/不用火|免火|无火|不开火|不做热食|无锅|没锅|没有锅|不加热|无需加热/,
  '亲子':/亲子|孩子|小孩|儿童/,'下酒':/下酒|佐酒/,
  '素食':/素食|吃素|全素|纯素|无肉|不吃肉|素菜/,'低预算':/低预算|省钱|便宜|预算紧|经济实惠/
};
const preferencePatterns:Record<string,RegExp>={
  '蛋':/鸡蛋|蛋类|蛋白|egg/i,'奶':/乳糖|牛奶|奶类|奶制品|乳制品|乳蛋白|牛乳|乳清|dairy|milk/i,
  '小麦':/小麦|麦麸|wheat/i,'含麸质谷物':/含麸质|麸质|麩質|gluten/i,'大豆':/黄豆|豆制品|豆乳|大豆|soy/i,
  '豆类':/豆类|所有豆|任何豆/,'坚果':/树坚果|树坚果类|tree nuts/i,'玉米':/粟米|corn/i,
  '辣椒':/不能吃辣|忌辣|不吃辣|不要辣|免辣/,'酒精':/不喝酒|不含酒|忌酒/,
};
const knownAbsent=['坚果','花生','芝麻','小麦','鱼','虾','甲壳类','贝类','蟹','海鲜','贝壳类','甲壳动物','牛肉','猪肉','鸡肉','羊肉','肉类','蛋黄酱','麸质','酒精','香菜','葱','姜','蒜','洋葱','葱蒜','白砂糖','糖','海产品','芥末','芹菜','禽肉','乳糖','蜂蜜','腰果','核桃','杏仁','鱼露','蚝油','酱油'];
const extraNames=['酸奶','豆乳酸奶','柠檬','豆腐','燕麦','鸡蛋','油','盐','豆类','小麦','奶','蛋','大豆','纯素','素食','蛋奶素','五辛','乳','乳制品','饮用水','辣','全素','植物性','蛋类','面粉','大豆蛋白','树坚果'];
const synonym:Record<string,string>={'乳':'奶','蛋类':'蛋','奶类':'奶','面粉':'小麦','辣':'辣椒','大豆蛋白':'大豆','植物性':'素食','纯素':'素食','全素':'素食','不吃肉':'素食','五辛':'葱蒜'};
const norm=(t:string)=>t.trim().toLowerCase().replace(/\s+/g,'');
const knownSet=new Set([...Object.values(foods).flatMap(f=>[f.name,f.short,...f.aliases,...f.allergens]),...Object.keys(preferencePatterns),...knownAbsent,...extraNames].map(norm));
function cleanTerm(term:string){
  const t=norm(term).replace(/^(?:不要|不含|不吃|不放|忌食|不加|避开|免掉|避免|忌|无)/,'').replace(/(?:过敏|不耐受|制品过敏者)$/,'');
  if(!t||t==='不限'||t==='没有'||t==='无忌口')return '';
  if(synonym[t])return synonym[t];
  if(knownSet.has(t))return t;
  for(const [key,p] of Object.entries(preferencePatterns))if(t.match(p)?.[0]===t)return key;
  return t;
}
function toolMethods(tools:string[]):Set<Method>{
  const list=tools.map(norm).join('、');
  const methods=new Set<Method>(['cold']);
  if(/无锅|没有锅|没锅|免火|不能开火|无设备|无厨具|不用火|不加热/.test(list))return methods;
  if(!list||/不限|都有|全套/.test(list))return new Set(['cold','pot','pan','bake']);
  if(/汤锅|奶锅|电煮锅|煮锅|小锅|炖锅|锅具|炒锅|电磁炉|燃气灶|灶台|电热锅|电饭煲|电饭锅|^锅$/.test(list))methods.add('pot');
  if(/空气炸锅|空炸锅|烤箱/.test(list))methods.add('bake');
  return methods;
}
const estimated=(parts:Qty[],people:number,key:'price'|'energy')=>parts.reduce((n,[id,q])=>n+foods[id][key]*q*people/100,0);
const price=(d:Draft,n:number)=>Math.ceil(estimated(d.portions,n,'price')*100)/100;
const id=(d:Draft)=>'wish-'+d.family+'-'+d.ids.join('-');
const round=(n:number)=>Math.round(n*100)/100;
function restrict(d:Draft,term:string){
  if(term==='素食')return d.portions.some(([key])=>key==='yog'||key==='eggs');
  if(term==='蛋奶素')return false;
  if(['蛋','奶','大豆','小麦','含麸质谷物','燕麦'].includes(term))return d.portions.some(([key])=>foods[key].allergens.includes(term));
  return d.portions.some(([key])=>{
    const f=foods[key];
    return [f.name,f.short,...f.aliases,...f.allergens].some(value=>norm(value).includes(term));
  });
}
function stable(text:string){let result=2166136261;for(const c of text)result=Math.imul(result^c.charCodeAt(0),16777619);return result>>>0;}
const assumptions=['预算按本餐全部人数的原料消耗量估算，单位为人民币；整包采购、运费和能源另计。','免火食谱需要饮用水、干净餐具，切配由能安全使用刀具的人完成。'];
function fail(...gaps:string[]):WishResult{return {status:'unavailable',recipes:[],gaps,assumptions:[...assumptions]};}
function recipe(d:Draft,n:number,kitchen:string[]):WishRecipe{
  const lead=d.portions[0][0],color=foods[lead].color;
  const poweredRice=d.family==='congee'&&kitchen.some(t=>/电饭(?:锅|煲)/.test(t))&&!kitchen.some(t=>/汤锅|煮锅|炒锅|奶锅|灶|电磁炉|电煮锅/.test(t));
  const appliance=d.method==='bake'?(kitchen.find(t=>/空气炸锅|烤箱/.test(t))??'烤箱或空气炸锅'):d.method==='cold'?'餐具':poweredRice?'电饭锅':'煮锅';
  const steps=[...d.steps];
  if(poweredRice)steps[1]='将米、水和菜丁放进内胆，勿超过该机型煮粥水位线。按说明选择煮粥模式，程序结束后确认米粒已开花；加入熟配料后再启用加热功能并煮沸三分钟。';
  if(poweredRice)steps[2]='确认配料已经热透，加盐，晾至适口温度再分碗。';
  return {id:id(d),title:d.title,description:d.desc,color,colorName:colors[color],luckyIngredient:foods[d.ids[0]].name,
    time:poweredRice?65+Math.ceil(n/2):d.time,difficulty:'简单',servings:n,kcal:Math.round(estimated(d.portions,n,'energy')),
    tags:d.tags,allergens:[...new Set(d.portions.flatMap(([key])=>foods[key].allergens))],
    ingredients:d.portions.map(([key,q])=>({name:foods[key].name,amount:round(q*n),unit:foods[key].unit})),steps,tip:d.tip,
    image:'',aliases:[],cuisine:'原创家常',category:d.category,tastes:d.tastes,seasons:['春','夏','秋','冬'],festivals:[],tools:[appliance],
    vegetarian:true,imageCredit:'原创文字配方，无成品图',kcalBasis:'按原料可食部、所列份量与用油估算整份热量。',estimatedCost:price(d,n),wishTags:d.tags,source:'wish',substitutions:[]};
}
export function makeWish(input:WishInput):WishResult {
  if(!input||typeof input.text!=='string'||!Array.isArray(input.avoid)||!Array.isArray(input.tools))return fail('请提供愿望、总预算、人数、忌口和可用厨具。');
  const {text,budget,people}=input;
  if(!text.trim())return fail('请写下你想要的口味、食材或做饭场景。');
  if(!Number.isInteger(people)||people<1||people>24)return fail('这组家庭配方支持 1–24 人，请填入实际整数人数。');
  if(!Number.isFinite(budget)||budget<=0)return fail('请填写大于零的整餐预算（元）。');
  if(![...input.avoid,...input.tools,...(input.excludes||[])].every(t=>typeof t==='string'))return fail('忌口、厨具和排除项需要填写文字。');
  if(/婴儿|婴幼儿|辅食|过敏原试敏|治疗|病餐|肾病|糖尿病|减药/.test(text))return fail('这一愿望涉及婴幼儿辅食或治疗饮食，现有家庭配方未对此作专门验证。');
  const all=drafts(people),excluded=new Set<string>(),rawTerms=[...input.avoid];
  for(const item of input.excludes||[]){
    if(item.startsWith('wish-')||all.some(d=>d.title===item)||/^[a-z][a-z0-9]*[-_][a-z0-9_-]+$/i.test(item))excluded.add(item);
    else rawTerms.push(item);
  }
  // Recognize explicitly written food restrictions, including a list after one negation.
  const restrictions=/(?:不吃|不能吃|不要放|不要|不放|不加|忌口[:：]?|避开|过敏原[:：]|对)([^，。；;！!\n]{1,40})/g;
  const freeNames=[...knownSet].filter(k=>k.length>1).sort((a,b)=>b.length-a.length);
  for(const match of text.matchAll(restrictions)){
    const raw=match[1].split(/，|但|想要|希望|最好|想吃|只要|过敏|不用火|分钟|预算/)[0].trim();
    if(!raw)continue;
    for(const part of raw.split(/、|和|与|或|及|\/|\+/).filter(Boolean)){
      const m=freeNames.find(k=>norm(part).startsWith(k));
      if(m)rawTerms.push(m);
      else if(part==='肉'||part.startsWith('肉类'))rawTerms.push('素食');
      else if(/^(辣|蛋|奶|葱|姜|蒜|鱼|虾|蟹|盐|油|糖)/.test(part))rawTerms.push(part[0]);
      else if(!/^(?:火|锅|油腻|太|肥|做|花|饭|热|冷的|贵)/.test(part))return fail('无法核对愿望中的限制「'+part+'」，请将具体食材写入忌口。');
    }
  }
  for(const token of freeNames)if(text.includes('无'+token)||text.includes('不含'+token))rawTerms.push(token);
  for(const hit of text.matchAll(/([\u3400-\u9fff]{1,9})(?:过敏|不耐受)/g)){
    const token=freeNames.find(k=>hit[1].endsWith(k))??(['蛋','奶','虾','鱼','蟹'].find(k=>hit[1].endsWith(k)));
    if(token)rawTerms.push(token);else if(!/对|过敏原/.test(hit[1]))return fail('无法解析过敏食材，请把具体名称列入忌口。');
  }
  const terms=[...new Set(rawTerms.flatMap(t=>t.split(/[、,，;；/]/)).map(cleanTerm).filter(Boolean))];
  const unknown=terms.filter(k=>!knownSet.has(k)&&!Object.values(synonym).includes(k));
  if(unknown.length)return fail('暂无法可靠核对这些忌口：'+unknown.join('、')+'。请补充具体食材名称。');
  const asked=Object.keys(themes).filter(k=>themes[k].test(text));
  if(/不能吃辣|不辣|不要辣|忌辣|不吃辣/.test(text))terms.push('辣椒');
  if(asked.includes('素食')||terms.includes('素食'))terms.push('素食');
  const textTools=text.match(/(?:只有|仅有|只能用|只用)(烤箱|空气炸锅|电饭锅|电饭煲|微波炉|热水壶|汤锅|煮锅|小锅|奶锅|平底锅|炒锅)/)?.[1];
  const actualTools=textTools?[...(input.tools.length?input.tools:[textTools])]:input.tools;
  const method=toolMethods(actualTools);
  if(textTools)for(const item of method)if(!toolMethods([textTools]).has(item))method.delete(item);
  const appliances=actualTools;
  const required:string[]=[];
  for(const match of text.matchAll(/(?:指定食材[：:]?|一定(?:要)?用|必须(?:要)?用|请用|想用)([^，。；;！!\n]{1,36})/g)){
    const raw=match[1].split(/来做|来煮|做|制作|烧|炒|搭配|作为/)[0];
    for(const t of raw.split(/[、和与+]/).filter(Boolean)){
      const food=freeNames.find(k=>norm(t)===k);
      if(!food)return fail('未能确认指定食材「'+t+'」的配方，请选一个已支持的原料或浏览菜谱库。');
      required.push(food);
    }
  }
  const electricRiceOnly=appliances.some(t=>/电饭煲|电饭锅/.test(t))&&!appliances.some(t=>/煮锅|汤锅|奶锅|灶|炒锅|电磁炉|电煮锅/.test(t));
  const limit=text.match(/(\d{1,3})\s*分钟(?:内|以内|搞定|完成)?/);
  const eligible=all.filter(d=>!excluded.has(id(d))&&!excluded.has(d.title)&&!terms.some(k=>restrict(d,k))&&method.has(d.method)
    &&(!electricRiceOnly||d.method!=='pot'||d.family==='congee')
    &&required.every(t=>d.portions.some(([key])=>[foods[key].name,foods[key].short,...foods[key].aliases].some(v=>v.includes(t))))
    &&asked.every(t=>d.tags.includes(t))&&(!limit||recipe(d,people,appliances).time<=Number(limit[1])));
  if(!eligible.length)return fail('现有原创配方无法同时满足'+[...asked,...required,...terms,...appliances,...(limit?[limit[0]]:[])].join('、')+'。请保留过敏与忌口，调整其他条件或选用菜谱库。');
  const affordable=eligible.filter(d=>price(d,people)<=budget);
  if(!affordable.length)return fail('满足这些口味、厨具和忌口的配方，'+people+' 人最低预计 ¥'+Math.min(...eligible.map(d=>price(d,people))).toFixed(2)+'，已高于总预算。');
  const wanted=freeNames.filter(term=>text.includes(term)&&!terms.some(t=>t.includes(term)||term.includes(t)));
  const fit=(d:Draft)=>wanted.filter(t=>d.portions.some(([k])=>foods[k].name.includes(t)||foods[k].aliases.includes(t))).length;
  affordable.sort((a,b)=>fit(b)-fit(a)||(asked.includes('低预算')?price(a,people)-price(b,people):0)||stable(text+id(a))-stable(text+id(b)));
  const selected:Draft[]=[],families=new Set<string>();
  for(const d of affordable)if(!families.has(d.family)&&selected.length<3){selected.push(d);families.add(d.family);}
  for(const d of affordable)if(selected.length<3&&!selected.includes(d))selected.push(d);
  const output=selected.map(d=>{
    const result=recipe(d,people,appliances);
    for(const alt of affordable.filter(x=>x.family===d.family&&x!==d)){
      const removed=d.portions.filter(([key])=>!alt.portions.some(([k])=>k===key));
      const added=alt.portions.filter(([key])=>!d.portions.some(([k])=>k===key));
      if(removed.length!==1||added.length!==1)continue;
      const [k,q]=added[0];
      if(result.substitutions.some(s=>s.to===foods[k].name))continue;
      result.substitutions.push({from:foods[removed[0][0]].name,to:foods[k].name,amount:round(q*people),unit:foods[k].unit,recipeId:id(alt),estimatedCost:price(alt,people),steps:recipe(alt,people,appliances).steps});
      if(result.substitutions.length===2)break;
    }
    return result;
  });
  return {status:'ok',recipes:output,gaps:[],assumptions:[...assumptions]};
}
