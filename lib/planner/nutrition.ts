import type { Recipe } from '@/lib/recipes';

export const nutritionConditions = ['减脂', '长痘', '痛风', '经期', '乳糖不耐', '素食', '清真'] as const;
export type NutritionCondition = typeof nutritionConditions[number];

export const conditionNotes: Record<NutritionCondition, string> = {
  减脂: '优先有蔬菜、豆类或瘦蛋白的家常搭配，保留主食。菜谱热量按默认份量估算，单道菜无法决定全天能量需求。',
  长痘: '优先蔬菜、豆类、全谷的组合，甜饮和甜点排序靠后。饮食与痤疮的关系因人而异，可记录自己反复观察到的触发因素。',
  痛风: '本次优先避开内脏、部分海鲜、红肉、肉汤、含酒配方和甜饮。豆腐、蔬菜仍可参与。急性发作或合并肾病时请按个人医嘱安排。',
  经期: '优先含铁食材，植物铁可搭配富含维生素C的蔬果。按自己的食欲选择温度；月经量大或长期乏力可咨询医生。',
  乳糖不耐: '本站保守跳过普通含奶配方，不同人对少量乳糖的耐受不同。牛奶蛋白过敏请另勾选「奶」过敏原，包括无乳糖牛奶。',
  素食: '按蛋奶素筛选，允许鸡蛋、乳制品，避开肉、鱼虾、肉汤、动物明胶和来源不明的动物凝乳酶。纯素还需排除蛋、奶、蜂蜜等。',
  清真: '展示可自行核对的植物及蛋类配方，跳过酒类、来源不明的肉类与动物辅料。本站没有清真认证，采购时仍需核对复合调味料、认证与厨具。',
};

export const nutritionSources: Record<NutritionCondition, { title: string; url: string }> = {
  减脂: {title:'中国居民膳食指南（2022）核心推荐',url:'https://wjw.fujian.gov.cn/ztzl/jkjy/jkzgxd/202206/t20220615_5930367.htm'},
  长痘: {title:'美国皮肤科学会 · 饮食与痤疮',url:'https://www.aad.org/public/diseases/acne/causes/diet'},
  痛风: {title:'国家卫生健康委 · 成人高尿酸血症与痛风食养指南',url:'https://www.nhc.gov.cn/wjw/c100378/202402/afd5dda4bd6745fda10aad8d43a16369.shtml'},
  经期: {title:'美国卫生与公众服务部女性健康办公室 · 缺铁性贫血',url:'https://womenshealth.gov/a-z-topics/iron-deficiency-anemia'},
  乳糖不耐: {title:'美国国家糖尿病、消化和肾脏疾病研究所 · 乳糖不耐饮食',url:'https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance/eating-diet-nutrition'},
  素食: {title:'英国国家医疗服务体系 · 素食搭配',url:'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/the-vegetarian-diet/'},
  清真: {title:'美国农业部 · 清真食品与认证',url:'https://www.fna.usda.gov/tefap/halal'},
};

export type NutritionAssessment = {
  eligible: boolean;
  score: number;
  highlights: string[];
  cautions: string[];
  excludedBy: string[];
};

const redMeat = /猪|豬|羊排|羊肉|羊肩|五花肉|排骨|培根|腊肉|腊肠|火腿|牛肉|牛肋|牛排|牛杂|牛腱|牛腩|牛肩|牛尾|牛里脊|肥牛|肉馅|肉糜|肉末|肉丝/;
const alcohol = /葡萄酒|红酒|白酒|啤酒|黄酒|料酒|米酒|米酿|酒酿|酒糟|甜酒|味醂|味淋|朗姆|白兰地|清酒|白葡萄酒|威士忌/;
const organ = /猪肚|牛肚|毛肚|肝脏|[鸡猪牛鸭鹅羊]肝|[鸡猪牛鸭鹅羊]肾|[鸡猪牛鸭鹅羊]心|大肠|肥肠|内脏|腰花|猪腰/;
const marine = /鱼|鲤|鲈|鳊|鳜|鲑|鱿|蛏|贝肉|牡蛎|蚝油|蚌|虾|蟹|蟶|海鲜|海蜇|蛤|海参|墨斗|瑶柱|干贝|贻贝/;
const shellOrRichFish = /虾|蟹|蛏|牡蛎|贻贝|蛤|干贝|扇贝|江鱼仔|凤尾鱼|沙丁鱼|鲱鱼|鳀鱼|柴鱼|蚝油|鱼露/;
const animal = /猪|五花|排骨|腊肠|香肠|培根|火腿|鸭肉|整鸭|鸭块|烤鸭|鹅肉|乳鸽|鸡汤|鸡高汤|鸡肉|鸡腿|鸡胸|整鸡|鸡翅|鸡爪|鸡肝|鸡油|鸡精|羊肉|羊排|羊肩|肉馅|肉糜|肉丝|肉片|肉末|肉干|肉松|肉汤|明胶|吉利丁|棉花糖|动物凝乳酶|动物油/;
const ambiguousCheese = /帕尔马|干酪|奶酪|芝士|马苏里拉|菲达/;
const ambiguousHalal = /奶|乳清|芝士|酪|黄油|酥油|糖蜜|酒醋|^(?:冷藏原味派皮|冷冻蛋挞皮|手指饼干|原味饼干)$/;
const dairy = /牛奶|羊奶|奶粉|奶酪|炼奶|炼乳|黄油|酪乳|干酪|淡奶|奶油|酸奶|芝士|奶片|奶清|乳清|鲜奶|奶精|紧压乳|马斯卡彭|马苏里拉|乳糖/;
const sweetener = /^(?:冰糖|细砂糖|白砂糖|白糖|糖|糖粉|红糖|黄糖|转化糖浆|枫糖浆|蜂蜜|浓缩果汁)$/;
const veg = /菠菜|番茄|西红柿|彩椒|红椒|青椒|辣椒|花椰菜|菜花|西兰花|花菜|白菜|青菜|菜心|油麦菜|卷心菜|包菜|胡萝卜|萝卜|芦笋|茭白|莴笋|西葫芦|南瓜|冬瓜|黄瓜|丝瓜|茄子|豆角|空心菜|菜薹|莲藕|粉藕|笋片|春笋|蘑菇|香菇|白玉菇|口蘑|茶树菇|芹菜|豆芽|洋葱/;
const beans = /(?:鹰嘴豆|扁豆|红豆|芸豆|绿豆|黑豆|黄豆|毛豆|豆腐|豆干|香干|腐竹|豆皮)/;
const grain = /糙米|藜麦|燕麦|全麦|荞麦|黑米|小米(?!椒)|全谷/;
const iron = /牛肉|牛腩|牛里脊|瘦猪肉|猪瘦肉|鹰嘴豆|扁豆|红豆|芸豆|豆腐|菠菜|黄豆|毛豆/;
const vitC = /西兰花|花椰菜|青椒|红椒|彩椒|甜椒|草莓|奇异果|橙子|甜橙|番茄|西红柿/;
const protein = /鸡蛋|蛋液|豆腐|豆干|香干|鹰嘴豆|毛豆|去皮去骨鸡腿|鸡胸|去皮熟鸡胸肉|牛里脊|牛腱|猪里脊|猪瘦肉|三文鱼|鲈鱼|虾仁|鳜鱼/;

function ingredientNames(recipe:Recipe) {
  // Negative ingredient descriptions such as vegetarian kimchi should not turn into fish.
  return recipe.ingredients.map(i=>i.name.replace(/无鱼虾|（无鱼露、虾酱）|蟹味菇|鱼香茄子|鱼腥草|牛油果|鸡腿菇|鸡枞菇/g,''));
}

// Quantities here distinguish a meaningful ingredient from a pinch of spice.
function hasSubstantial(recipe:Recipe,pattern:RegExp) {
  return recipe.ingredients.some(i=>{
    if(!pattern.test(i.name) || /粉末|豆沙|姜粉|红椒粉|番茄酱|糖浆|辣椒粉|果酱|果汁|干辣椒|干辣椒碎|粉丝|淀粉|豆瓣酱|酱油|豆瓣|豆蔻/.test(i.name)) return false;
    if(i.unit==='克' || i.unit==='g') return i.amount / Math.max(recipe.servings,1) >= 12;
    return /^(个|枚|只|颗|根|棵)$/.test(i.unit) && i.amount>0;
  });
}

export function assessNutrition(recipe:Recipe, conditions: readonly NutritionCondition[] = []): NutritionAssessment {
  const selected=new Set(conditions);
  const names=ingredientNames(recipe);
  const has=(pattern:RegExp)=>names.some(n=>pattern.test(n));
  const hasAlcohol=!!recipe.alcohol || names.some(n=>alcohol.test(n) && !/无酒精|酒醋/.test(n));
  const isMeat=has(redMeat) || has(animal) || has(marine);
  const animalCheese=names.some(n=>ambiguousCheese.test(n) && !/植物凝乳酶|微生物凝乳酶|素食奶酪/.test(n));
  const hasVeg=hasSubstantial(recipe,veg);
  const hasBeans=hasSubstantial(recipe,beans);
  const hasProtein=hasSubstantial(recipe,protein);
  const hasGrain=hasSubstantial(recipe,grain);
  const hasIron=hasSubstantial(recipe,iron);
  const hasC=hasSubstantial(recipe,vitC);
  const isDrink=/饮品|饮料|热饮|茶饮|甜饮/.test(recipe.category);
  const sweetDrink=isDrink && (has(sweetener) || has(/果汁|葡萄汁|苹果汁|可乐|汽水|糖浆/));
  const dessert=/糖水|甜品|甜点/.test(recipe.category);
  const result:NutritionAssessment={eligible:true,score:0,highlights:[],cautions:[],excludedBy:[]};
  if(selected.has('素食') && (!recipe.vegetarian || isMeat || animalCheese))
    result.excludedBy.push('素食：含动物来源食材，或配方无法确认适合蛋奶素。');
  if(selected.has('清真') && (!recipe.vegetarian || isMeat || hasAlcohol || names.some(n=>ambiguousHalal.test(n.replace(/椰奶|燕麦奶|豆奶|杏仁奶/g,'')))))
    result.excludedBy.push('清真：酒类、肉类、动物辅料或来源未核实的复合原料未纳入备选。');
  if(selected.has('乳糖不耐')) {
    const ordinaryMilk=names.some(n=>dairy.test(n) && !/无乳糖|零乳糖|脱乳糖|椰奶|豆奶|杏仁奶|燕麦奶|植物奶油/.test(n));
    const unidentifiedMilk=recipe.allergens.includes('奶') && !names.some(n=>/无乳糖|零乳糖|脱乳糖/.test(n));
    if(ordinaryMilk || unidentifiedMilk) result.excludedBy.push('乳糖不耐：配方含普通乳制品，或预制配料的乳糖含量未知。');
  }
  if(selected.has('痛风')) {
    const meatSoup=(/汤|羹|火锅|锅底/.test(recipe.category+recipe.title) && isMeat) || has(/鸡汤|肉汤|骨汤|浓汤宝|肉汁/);
    if(has(organ) || has(shellOrRichFish) || has(redMeat) || hasAlcohol || meatSoup || sweetDrink)
      result.excludedBy.push('痛风：本次跳过内脏、红肉、部分海鲜、肉汤、酒或甜饮类配方。');
  }
  if(result.excludedBy.length){result.eligible=false;return result;}
  if(hasVeg) result.highlights.push('配方中有蔬菜，能为这一餐增加蔬菜种类。');
  if(hasBeans) result.highlights.push('含豆类或豆制品，增加植物性食材的种类。');
  if(hasProtein && !hasBeans) result.highlights.push('蛋、鱼、豆或瘦肉类食材可提供蛋白质。');
  if(hasGrain) result.highlights.push('含全谷食材，主食口感更多样。');
  if(selected.has('减脂') || selected.has('长痘')){
    result.score+=Number(hasVeg)*3+Number(hasBeans)*2+Number(hasGrain)*2;
    result.score-=Number(sweetDrink || dessert)*4;
  }
  if(selected.has('减脂')){
    result.score+=Number(hasProtein)*2;
    if(!isDrink && !dessert && !hasVeg) result.cautions.push('本菜蔬菜较少，可另搭一份当季蔬菜。');
    if(sweetDrink || dessert) result.cautions.push('作为点心少量搭配，正餐仍保留主食和蛋白质食材。');
  }
  if(selected.has('长痘') && (sweetDrink || dessert)) result.cautions.push('想观察甜食与皮肤状态的关系时，可记录食用频率与自身反应。');
  if(selected.has('痛风')) result.score+=Number(hasVeg)*2+Number(hasBeans);
  if(selected.has('经期')){
    result.score+=Number(hasIron)*3+Number(hasIron && hasC)*2;
    if(hasIron) result.highlights.push(hasC?'含铁食材与含维生素C的蔬果在同一份配方中。':'这道菜有含铁食材，可配番茄、西兰花或鲜橙。');
  }
  if(selected.has('素食')) result.score+=Number(hasBeans)*2+Number(hasGrain);
  if(selected.has('清真')) result.cautions.push('仅按配料初筛，调味料、加工方式与器具须自行核实清真要求。');
  return result;
}

export type SeasonName='春'|'夏'|'秋'|'冬';
export type SeasonFood={name:string; aliases:string[]; selection:string; tradition:string; reason:string};
const seasonFoods:Record<SeasonName,SeasonFood[]>={
  春:[
    {name:'春笋',aliases:['春笋','笋片'],selection:'选笋壳紧裹、基部切口湿润且无霉点的，鲜笋煮透后食用。',tradition:'江南春桌常把笋做成油焖菜或配鲜肉炖汤。',reason:'春笋脆嫩，薄切煮熟后适合做春饼馅。'},
    {name:'芦笋',aliases:['芦笋','露笋'],selection:'看笋尖是否紧实，茎秆直而饱满，基部干裂太多的宜避开。',tradition:'春季的芦笋用盐水煮熟或快炒，保留嫩茎的脆口。',reason:'适合与蛋、菇或米饭搭配，做一餐用时不长的热菜。'},
    {name:'韭菜',aliases:['韭菜'],selection:'挑根部切口新鲜、叶片直挺、没有黄叶或发黏的。',tradition:'春日家常韭菜常用来炒蛋、包饺子或烙馅饼。',reason:'叶嫩香浓，一把就能给蛋和面食添香。'},
    {name:'豆芽',aliases:['豆芽','芽菜'],selection:'看芽身饱满、子叶完整，无发黏或异味，买回及时烹煮。',tradition:'春饼里常卷一份炒熟的豆芽。',reason:'配叶菜或肉丝能多一层爽脆口感。'},
  ],
  夏:[
    {name:'冬瓜',aliases:['冬瓜'],selection:'整瓜表皮应完整，切块选瓤实、切面没有软烂的。',tradition:'名字带“冬”，在岭南的夏汤里很常见。',reason:'瓜块煮到半透明即可与姜丝做清汤。'},
    {name:'黄瓜',aliases:['黄瓜','青瓜'],selection:'选手感结实、表皮新鲜、两端没有软缩的瓜。',tradition:'夏日常做拍黄瓜，也可与豆腐一同入菜。',reason:'质地清脆，适合搭配凉面或炒蛋。'},
    {name:'空心菜',aliases:['空心菜','通菜'],selection:'看叶片鲜绿无黏滑，掐茎较嫩，切口湿润。',tradition:'岭南把空心菜叫通菜，蒜蓉快炒是常见家常做法。',reason:'适合当一道现炒绿叶菜，茎和叶可分先后下锅。'},
    {name:'豆角',aliases:['豆角','豇豆','四季豆'],selection:'挑豆荚饱满、无发霉腐烂的；烹调至完全熟透。',tradition:'夏季豆角常切段焖煮或与面条搭配。',reason:'能与米面、蛋或肉搭出不同口感。'},
  ],
  秋:[
    {name:'莲藕',aliases:['莲藕','粉藕','藕片'],selection:'选藕节完整、表皮不软烂的，切开后洗净藕孔。',tradition:'湖北煨汤偏用粉藕，江南凉拌或清炒常选脆藕。',reason:'同样的根茎可做爽脆配菜，也适合慢炖。'},
    {name:'南瓜',aliases:['南瓜','老南瓜'],selection:'选瓜蒂干燥、瓜皮硬实且没有软斑的，切块后冷藏。',tradition:'老南瓜蒸着吃、煮粥或打汤都是秋天饭桌上的家常做法。',reason:'熟瓜肉有自然甜味，压泥即可给汤增加稠度。'},
    {name:'芋头',aliases:['芋头','芋艿'],selection:'选芋身结实、没有渗液和黑腐斑的，削皮可戴手套，充分煮熟。',tradition:'芋头蒸食或切块焖煮，家常做法多取其粉糯。',reason:'块茎能作为一餐的部分主食。'},
    {name:'西兰花',aliases:['西兰花','青花菜'],selection:'花蕾应紧密、颜色均匀，避免选大面积泛黄或软烂的。',tradition:'秋冬菜市场常见球状花菜，焯熟后再快炒能保留脆度。',reason:'和豆腐、虾仁或彩椒都容易搭配。'},
  ],
  冬:[
    {name:'白萝卜',aliases:['白萝卜','小萝卜'],selection:'同等大小选手感较沉、表皮光洁且捏起来坚实的。',tradition:'冬季把萝卜切块炖汤，也可切丝煮面。',reason:'清甜口感适合配浓味主菜或清汤。'},
    {name:'大白菜',aliases:['大白菜','娃娃菜'],selection:'选菜帮脆挺、叶片完好，根部没有腐坏的菜棵。',tradition:'北方冬季家常用大白菜做炖菜、饺子馅。',reason:'菜帮耐煮，叶片容易熟，可分次下锅。'},
    {name:'菜心',aliases:['菜心','菜薹'],selection:'挑梗直、叶片有弹性、切口不干裂的，避开发黏的菜束。',tradition:'冬天广东常用白灼或蒜蓉快炒来吃菜心。',reason:'口感嫩，给煲仔饭或面条配一碟很方便。'},
    {name:'菠菜',aliases:['菠菜'],selection:'选叶片浓绿完整、叶柄挺实、没有明显腐损的。',tradition:'冷凉季节的菠菜常做蛋汤，也常与其他菜同炒。',reason:'深色叶菜可与豆腐、蛋、番茄搭配。'},
  ],
};

const termNotes:Record<string,string>={
  立春:'北方部分地区会“咬春”，用春饼卷熟豆芽与时蔬。',雨水:'天气渐湿，用新鲜嫩菜配一碗热汤面。',惊蛰:'一些地区有惊蛰吃梨的习惯，鲜吃或炖梨都可。',春分:'春分吃春菜各地取材不同，可用市场里的食用嫩菜做汤。',清明:'江南有吃青团的习俗，家庭制作宜用可食用的正规艾草制品。',谷雨:'北方有食香椿的习惯；买不到时也可以当季鲜笋做春菜。',
  立夏:'部分地区吃立夏蛋，煮熟后可配一盘时蔬。',小满:'上市的瓜菜渐多，用嫩瓜和豆腐做一餐。',芒种:'农忙时节可提前煮一锅饭，现炒一盘瓜菜。',夏至:'北方有夏至吃面的习俗，一碗面配熟豆芽和黄瓜丝。',小暑:'选本地夏瓜做汤，瓜片、瓜块能煮出不同口感。',大暑:'岭南夏日常见糖水，绿豆与椰奶可各按喜好取用。',
  立秋:'立秋未必马上凉爽，买菜仍可依当地菜市场供应。',处暑:'换季时瓜菜和根茎常可同桌，清汤里保留蔬菜本味。',白露:'莲藕、南瓜可作为这段时间的家常主料。',秋分:'蒸南瓜或炒藕片，选一种当地产的秋菜试试。',寒露:'晚餐可配一份炖得软糯的莲藕，或选择当季根茎。',霜降:'南瓜蒸熟后压泥，适合入粥或做浓汤。',
  小寒:'寒天可将萝卜、白菜慢炖，次日做饭前再买新鲜叶菜。',大寒:'将粉糯的芋头或山药配上一锅热汤，注意按需备料。',立冬:'北方一些地方用饺子迎冬，馅料可用大白菜。',小雪:'萝卜切厚块炖汤，切细丝就适合快炒。',大雪:'用白菜、豆腐、粉条做家常炖菜，按人数调量。',冬至:'北方常吃饺子，南方部分地区吃汤圆，家家做法各异。',
};

export function seasonalGuide(season:SeasonName,term?:string) {
  return {foods:seasonFoods[season],termNote:term ? termNotes[term] || '' : '',region:'以中国北半球常见餐桌及华南、长江流域供应为参考，各地上市月份随气候和栽培方式变化。'};
}
