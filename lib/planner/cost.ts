/** Reference quantities describe prepared edible ingredients. Rates are editable kitchen
 * budgeting assumptions in CNY, not quotes. Weight, volume and number are distinct. */
export interface PantryItem { name: string; amount: number; unit: string }
export interface CostRecipe { id: string; title?: string; servings: number; ingredients: readonly PantryItem[] }
export interface Selection { recipe: CostRecipe; people: number }
export type PriceOverrides = Readonly<Record<string, number>>
export interface Price { unit: string; basis: number; yuan: number }
export interface IngredientInfo {
  name: string; aliases: string[]; category: string; storage: string; substitutes: string[];
  prices: Price[]; defaultUnit: string; known: boolean;
}
export interface ShoppingLine {
  name: string; category: string; unit: string; required: number; available: number;
  fromPantry: number; toBuy: number; cost: number | null; purchaseCost: number | null;
  unitPrice: number | null; priceUnit: string; storage: string; substitutes: string[];
  aliases: string[]; household: boolean;
}
export interface ShoppingResult {
  items: ShoppingLine[]; groups: {category:string;items:ShoppingLine[]}[];
  totalCost:number; purchaseCost:number; missingPrices:string[];
}
export const PRICE_BASIS = '家庭预算示例价，单位为人民币；克和毫升按每100单位标价，个和片按单件标价。价格可自行修改；总价按食用量估算，不含包装、运费及能源。'
export const STORAGE_REFERENCE = 'https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts'

const catalogTable = `
肉禽|3.4|克|五花肉~带皮五花肉 猪肉片~猪瘦肉 猪里脊 猪肉糜~猪肉末~猪肉馅~肥瘦猪肉馅
肉禽|4.0|克|猪小排~带骨猪肋排 猪蹄块
肉禽|1.5|克|处理净猪皮
肉禽|5.8|克|原味全熟猪肚
肉禽|6.9|克|牛肉~牛肉丝 牛肉糜 牛腩 牛腱 肥牛片
肉禽|10.5|克|牛里脊 西冷牛排 整切牛排
肉禽|7.5|克|羊排~带骨羊排~羊排块 去骨羊肩肉
肉禽|2.0|克|整鸡 鸡腿块 鸭肉块~鸭块
肉禽|2.8|克|鸡腿肉~去骨鸡腿~去骨鸡腿肉 去皮去骨鸡腿 去骨鸡胸 鸡爪
肉禽|3.5|克|鸡翅中 去皮熟鸡胸肉
肉禽|5.0|克|去骨鸡爪 净乳鸽 培根 腊肠 腊猪肉
肉禽|1.6|克|鸡肝
肉禽|3.2|克|熟火腿
水产|5.2|克|带壳大虾~大虾~鲜虾 净鲈鱼 净昂刺鱼 熟蛏肉
水产|7.4|克|虾仁~去壳虾仁 熟虾仁 净鳜鱼
水产|2.6|克|净鳊鱼 净鲤鱼
水产|17|克|三文鱼~三文鱼排
水产|5|克|豆豉鲮鱼罐头 即食炸江鱼仔
水产|22|克|柴鱼片
蛋奶|1.0|个|鸡蛋 熟蛋黄
蛋奶|1.7|个|皮蛋
蛋奶|2.3|克|全蛋液~鸡蛋液~去壳鸡蛋 蛋黄
蛋奶|1.4|毫升|牛奶~纯牛奶~全脂牛奶
蛋奶|2.4|克|原味酸奶~原味全脂过滤酸奶
蛋奶|5.2|毫升|淡奶油~冷藏淡奶油（脂肪约35%）~淡奶油（乳脂至少35%）
蛋奶|6.5|克|无糖打发奶油 酸奶油
蛋奶|9.0|克|黄油~冷藏黄油~冷黄油 无盐黄油~冷藏无盐黄油 奶油奶酪 马苏里拉芝士 奶粉
蛋奶|12|克|切达奶酪 干凝乳奶酪 菲达奶酪 鲜马苏里拉奶酪 马斯卡彭
蛋奶|15|克|帕尔马奶酪
蔬菜|0.55|克|土豆~去皮土豆 卷心菜~包菜 大白菜 大白菜嫩叶 白萝卜 冬瓜~去皮冬瓜 南瓜~去皮南瓜 洋葱 胡萝卜
蔬菜|0.9|克|娃娃菜 甜菜根 红洋葱 红薯 青菜~小青菜 小白菜 菜心 生菜 青椒~青尖椒~青辣椒 红椒 彩椒 黄瓜 西葫芦 番茄 长茄子~茄子 莴笋 莴笋叶 芹菜 空心菜 油麦菜 小萝卜 葱白
蔬菜|1.25|克|菠菜 绿豆芽 黄豆芽 豆芽 四季豆 豆角 山药 去皮芋头 韭菜 花菜 西兰花 莲藕~粉藕 玉米~甜玉米 甜玉米粒~玉米粒 熟甜玉米粒 熟南瓜泥 青豌豆
蔬菜|2.3|克|荷兰豆 茭白 去壳鲜春笋 即食熟笋片 芦笋 带壳毛豆 蒜苗 小米椒 辣椒 大蒜~蒜 生姜~鲜姜~姜 嫩姜 葱~小葱~香葱~葱花 香菜 红葱头
蔬菜|4.8|克|鲜食用百合 欧芹 莳萝 罗勒叶 薄荷叶 新鲜迷迭香
蔬菜|1.7|毫升|姜汁
菌菇豆制品|1.25|克|老豆腐~北豆腐 嫩豆腐 湿烤麸
菌菇豆制品|2.6|克|白豆干 香干 鲜香菇 白蘑菇~口蘑 白玉菇 蟹味菇 金针菇
菌菇豆制品|3.6|克|鲜茶树菇
菌菇豆制品|7.8|克|干香菇 干黑木耳~干木耳 干银耳 干豆腐皮 干黄花菜
水果|0.6|克|去皮西瓜
水果|1.5|克|去核苹果~去核红苹果~去核苹果果肉 去核青苹果 去核雪梨 甜橙 橙皮 菠萝 柠檬
水果|2.8|个|柠檬 橙子 柑橘 百香果
水果|3.1|克|芒果~熟芒果果肉 奇异果 草莓 牛油果
水果|7.9|克|蓝莓
水果|2.5|毫升|柠檬汁~鲜榨柠檬汁 青柠汁
米面主食|0.7|克|大米 熟米饭 圆糯米~糯米
米面主食|0.85|克|面粉~小麦面粉~中筋面粉~中筋小麦粉 低筋面粉~低筋小麦粉 高筋面粉 干挂面~干面条~长条干小麦面 鲜面条 鲜细面条~细鲜面 鲜宽面 水磨糯米粉~糯米粉 粘米粉（大米粉）~粘米粉
米面主食|1.3|克|鲜米粉~鲜米线 干米粉 干粉丝 豌豆凉粉 饺子皮（小麦） 蒸肉米粉
米面主食|2.1|克|干意面~干意大利面 通心粉 干荞麦面 意大利烩饭米 库斯库斯 方便面饼 白吐司 面包糠 熟春饼 熟油条
米面主食|2.9|克|干米纸 小西米~小粒干西米 无糖原味炒米花 原味饼干 即食虾片
米面主食|3.8|克|手指饼干 冷藏原味派皮
米面主食|1.2|个|冷冻蛋挞皮
米面主食|0.45|片|干粽叶
豆类坚果与干货|1.3|克|干绿豆 干薏米 熟白芸豆 熟鹰嘴豆 熟去皮绿豆碎 无糖熟红豆
豆类坚果与干货|3.5|克|红枣~去核红枣 干莲子~干去芯莲子 去核蜜枣 干桂圆肉 葡萄干 干梅菜
豆类坚果与干货|2.4|克|熟花生~熟花生仁 无盐烤花生 熟芝麻 白芝麻~芝麻 熟黑芝麻
豆类坚果与干货|6.9|克|杏仁 腰果 蔓越莓干 低水分烘焙红豆沙（纯红豆、糖、植物油） 红豆沙（纯红豆、糖、植物油）~熟红豆沙（红豆、糖）
豆类坚果与干货|7.5|克|山楂干片 食品级去核乌梅干 陈皮 话梅 金桔蜜饯
豆类坚果与干货|9.8|克|干裙带菜 干昆布 海苔
调味与油脂|0.35|克|盐~海盐
调味与油脂|0.9|克|糖~白糖~细砂糖~白砂糖 冰糖 红糖
调味与油脂|1.4|克|食用油~油~植物油 菜籽油 玉米油 淀粉 玉米淀粉 土豆淀粉 木薯淀粉 澄粉（小麦淀粉） 糖粉
调味与油脂|2.8|克|蚝油 甜面酱 豆瓣酱 黄豆酱 番茄酱 番茄泥 剁椒 糍粑辣椒 酸笋 雪菜 橄榄菜 菜脯 酸腌菜 豆豉 素白菜泡菜（无鱼露、虾酱） 棉花糖
调味与油脂|5|克|橄榄油 芝麻油~香油 辣椒油 芝麻酱~纯芝麻酱 蜂蜜 咖喱块 柱侯酱 白味噌（无大麦） 韩式辣酱 番茄膏 芥末酱 去核黑橄榄 草莓果酱 糖桂花 糖蜜 转化糖浆 咖椰酱 素叁巴辣酱
调味与油脂|1.6|毫升|生抽~淡酱油 老抽 酱油 蒸鱼豉油 米醋 香醋 陈醋 醋 料酒
调味与油脂|3.5|毫升|苹果醋 红酒醋 印尼甜酱油 鱼露 无鱼虾素泡菜汁
调味与油脂|8.5|毫升|枫糖浆
烘焙与香料|3|克|食品级月饼专用枧水 小苏打 泡打粉~无铝泡打粉 酵母 椒盐
烘焙与香料|7|克|甜红椒粉 红椒粉 烟熏红椒粉 干辣椒 辣椒面~辣椒粉 干辣椒碎 姜粉 姜黄粉 花椒~花椒粒 花椒粉 孜然粉 芫荽籽粉 桂皮 肉桂棒 肉桂粉 八角 五香粉 可可粉~无糖可可粉
烘焙与香料|12|克|黑胡椒 整粒黑胡椒 白胡椒粒 无盐葛拉姆玛萨拉 干月桂叶 干牛至 干百里香 丁香 绿豆蔻 食用艾草粉 吉利丁片 吉利丁粉~牛源吉利丁粉
烘焙与香料|35|克|干桂花~食用干桂花
饮品|0|毫升|水~清水~开水~热水~沸水~冷水~冰水~温水~饮用水~冷饮用水~温饮用水~泡米清水~煮粽清水~清水（拌馅）
饮品|0|克|冰块
饮品|0.65|毫升|含糖可乐 啤酒
饮品|1.1|毫升|无盐鸡汤~无盐鸡汤（原味鸡肉清汤） 无盐蔬菜汤（水煮蔬菜自制） 无酒精苹果汁 无酒精白葡萄汁 黑咖啡
饮品|1.8|毫升|椰奶 无糖椰奶 椰子水
水果|1.5|克|柚子果肉 去皮熟香蕉
水果|3.2|克|柠檬皮屑（黄色部分）
米面主食|1.8|克|原味燕麦片 原味快熟燕麦片
蛋奶|2.8|毫升|无糖淡奶
蛋奶|2.4|克|蛋清
蛋奶|3.8|克|甜炼乳
烘焙与香料|19|克|冻干草莓粉 抹茶粉
烘焙与香料|7.2|克|成品蛋白霜糖（蛋清、糖） 无糖干椰蓉
烘焙与香料|8.5|克|无奶黑巧克力豆（含大豆卵磷脂） 巧克力米（含大豆卵磷脂）
饮品|3.2|毫升|椰浆~无糖椰浆 干红葡萄酒
饮品|10|克|红茶~红茶叶
`.trim()
const stores: Record<string,string> = {
  '肉禽':'生肉密封盛放在冷藏室下层，与即食食物分开。不能尽快使用时按餐分装冷冻。',
  '水产':'生鲜水产密封冷藏在下层，与其他食物隔开；暂不烹饪时分装冷冻。',
  '蛋奶':'鲜蛋和鲜奶制品按包装冷藏，保持冷藏室不高于4℃。开封后遵照包装期限。',
  '蔬菜':'去除腐坏部分，烹调前清洗。鲜切蔬菜密封冷藏，尽快使用。',
  '菌菇豆制品':'鲜菇和鲜豆制品按包装冷藏。开封后及时食用，避免与生肉接触。',
  '水果':'切开的水果盖好冷藏；完整水果按成熟程度和包装说明存放。',
  '米面主食':'干制品密闭防潮；鲜制、熟制、冷冻主食按包装或原冷链条件保存。',
  '豆类坚果与干货':'未泡发干货密封防潮，坚果避热避光。泡发或熟制后及时冷藏。',
  '调味与油脂':'避光密封，以干净干燥器具取用；开封后是否冷藏以标签为准。',
  '烘焙与香料':'保持干燥密封，远离灶火；酵母与湿性原料按包装要求保存。',
  '饮品':'包装完好的常温饮品按标签存放，已经开封或自制的易腐饮品及时冷藏。',
  '其他':'按食材包装标示保存；易腐食物及时冷藏。'
}
const swaps: Record<string,string[]> = {
  '番茄':['同重量小番茄，切开后再烹调'], '红洋葱':['同重量普通洋葱'], '洋葱':['同重量红洋葱，色泽稍深'],
  '西兰花':['同重量花菜，按小朵大小调整熟化时间'], '花菜':['同重量西兰花，口感与颜色不同'],
  '青椒':['同重量甜椒，辣度降低'], '红椒':['同重量甜椒，按颜色选购'],
  '白蘑菇':['同重量栽培鲜香菇，去除硬蒂并加热熟透'], '白玉菇':['同重量栽培蟹味菇，彻底加热'],
  '菜心':['同重量小白菜，先烫菜梗再烫叶'], '去核苹果':['同重量去核青苹果，酸度略高'],
  '去核青苹果':['同重量去核红苹果，甜度略高'],
  '橙子':['榨汁时可用等体积鲜甜橙汁，保留果肉的做法不适用'],
  '香菜':['作为装饰时可省略'],
  '薄荷叶':['作为装饰时可省略'], '蒜苗':['同重量青蒜'], '无盐黄油':['同重量无盐烘焙黄油'],
  '干红葡萄酒':['热饮可改用无酒精葡萄汁；甜度较高，可减少额外加糖'],
  '啤酒':['炖煮时可用等体积清水，风味会变淡']
}
const cleanName = (value:string) => value.normalize('NFKC').trim().replace(/\s+/g,'')
const inputAliases: Record<string,string> = {
  '绿豆':'干绿豆','西红柿':'番茄','马铃薯':'土豆','洋芋':'土豆','鸡子':'鸡蛋','西蓝花':'西兰花',
  '圆白菜':'卷心菜','包心菜':'卷心菜','大头菜（卷心菜）':'卷心菜','大蒜瓣':'大蒜',
  '青瓜':'黄瓜','胡瓜':'黄瓜','青蒜':'蒜苗','生粉（玉米淀粉）':'玉米淀粉',
  '鲜奶':'牛奶','巴氏鲜奶':'牛奶','意大利面（干）':'干意面','豆腐（老豆腐）':'老豆腐'
}
const byName=new Map<string,IngredientInfo>()
const byKey=new Map<string,IngredientInfo>()
for (const row of catalogTable.split('\n')) {
  const [category, rate, unit, foodGroups] = row.split('|')
  for (const group of foodGroups.split(' ')) {
    const [name,...aliases] = group.split('~')
    let item=byName.get(name)
    if (!item) {
      let storage = stores[category]
      if (/^(干木耳|干黑木耳|干银耳|干香菇|干黄花菜|干豆腐皮)/.test(name)) storage='未泡发时密封防潮。泡发后及时烹调；长时间泡发应冷藏。'
      if (/^(生姜|大蒜|洋葱|红洋葱|土豆)$/.test(name)) storage='完整未切时避光、干燥、通风保存；切开或削皮后及时冷藏。'
      if (/^熟米饭|^熟春饼|^熟油条|^去皮熟鸡胸肉|^原味全熟猪肚|^熟虾仁|^熟蛏肉|^熟火腿|^熟白芸豆|^熟鹰嘴豆|^熟去皮绿豆碎|^无糖熟红豆/.test(name)) storage='熟食分装入干净浅盒，制作后两小时内冷藏，室温高于32℃时限一小时。'
      if (/^豆豉鲮鱼罐头|^即食炸江鱼仔|^柴鱼片/.test(name)) storage='未开封按罐身或袋装标签存放；开封后按说明冷藏或密封保存。'
      if (/^冷冻蛋挞皮/.test(name)) storage='保持冷冻、按包装说明取用。'
      if (/^奶粉/.test(name)) storage='未冲调奶粉按标签密封存放，防潮避热。'
      if (/^水$|^冰块$/.test(name)) storage='使用可直接饮用的水，冰块用干净冰格覆盖冷冻。'
      item={name,aliases:[],category,storage,substitutes:swaps[name]??[],prices:[],defaultUnit:unit,known:true}
      byName.set(name,item)
    }
    item.prices.push({unit,basis:unit==='克'||unit==='毫升'?100:1,yuan:Number(rate)})
    for (const val of [name,...aliases]) {
      byKey.set(cleanName(val),item)
      if(val!==name && !item.aliases.includes(val)) item.aliases.push(val)
    }
  }
}
function additionalRate(name:string,unit:string,basis:number,yuan:number) {
  byName.get(name)?.prices.push({unit,basis,yuan})
}
// Volume and mass prices are separate rates. They do not enable inventory conversion.
additionalRate('食用油','毫升',100,1.3)
additionalRate('淡奶油','克',100,5.2)
additionalRate('枫糖浆','克',100,6.5)
for (const [alias,canonical] of Object.entries(inputAliases)) {
  const item=byName.get(canonical)
  if (item) { byKey.set(cleanName(alias),item); if(!item.aliases.includes(alias)) item.aliases.push(alias) }
}
export const allIngredientInfo: readonly IngredientInfo[]=[...byName.values()]
export function ingredientInfo(name:string):IngredientInfo {
  const found=byKey.get(cleanName(name))
  return found??{name:name.trim(),category:'其他',aliases:[],storage:stores['其他'],substitutes:[],prices:[],defaultUnit:'克',known:false}
}
const equipmentGroups=[
  ['平底锅','不粘平底锅','不粘煎锅','不粘锅','厚底煎锅','煎锅'],
  ['深煎锅','平底深锅'],['有盖平底锅','带盖平底锅'],['有盖锅','带盖锅'],
  ['汤锅','煮锅','深汤锅','炖锅'],['小汤锅','奶锅','小锅','小深锅'],
  ['砂锅','沙锅'],['电饭锅','电饭煲'],['料理机','搅拌机'],['食物温度计','食品温度计','厨房探针温度计'],
  ['碗','小碗','大碗','浅碗','料理碗'],['拌碗','搅拌碗','搅拌盆'],
  ['菜板','切菜板','砧板'],['盘','平盘','浅盘','大盘','长盘'],['密封盒','干净密封盒']
]
const toolNames=new Map(equipmentGroups.flatMap(([canonical,...aliases])=>[canonical,...aliases].map(alias=>[cleanName(alias),canonical] as const)))
export function normalizeTool(name:string):string {return toolNames.get(cleanName(name))??name.trim()}

const unitConversions:Record<string,[string,number]>={
  g:['克',1],克:['克',1],kg:['克',1000],公斤:['克',1000],千克:['克',1000],斤:['克',500],
  ml:['毫升',1],毫升:['毫升',1],l:['毫升',1000],升:['毫升',1000],
  个:['个',1],枚:['个',1],片:['片',1]
}
export function normalizeQuantity(name:string,amount:number,unit:string):PantryItem {
  if(!name.trim()||!unit.trim()||!Number.isFinite(amount)||amount<0) throw Error('食材名称、非负数量和单位必填')
  const unitKey=unit.normalize('NFKC').trim().toLowerCase()
  const [base,factor]=Object.hasOwn(unitConversions,unitKey)?unitConversions[unitKey]:[unit.trim(),1]
  const result=amount*factor
  if(!Number.isFinite(result)) throw Error('食材数量超出范围')
  return {name:ingredientInfo(name).name,amount:result,unit:base}
}
export function priceKey(name:string,unit:string):string { const q=normalizeQuantity(name,1,unit);return q.name+'|'+q.unit }
const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100
const rounded=(n:number)=>Math.round(n*1e6)/1e6
function accumulate(map:Map<string,PantryItem>, item:PantryItem) {
  const q=normalizeQuantity(item.name,item.amount,item.unit)
  const key=q.name+'|'+q.unit;const prev=map.get(key)
  if(prev) prev.amount+=q.amount
  else map.set(key,q)
}
function costRate(info:IngredientInfo,unit:string,overrides:PriceOverrides):Price|null {
  const r=info.prices.find(p=>p.unit===unit)
  const key=info.name+'|'+unit
  if(Object.hasOwn(overrides,key)){
    const val=overrides[key]
    if(!Number.isFinite(val)||val<0) throw Error('单价必须为非负数')
    return {unit,basis:r?.basis??(unit==='克'||unit==='毫升'?100:1),yuan:val}
  }
  return r??null
}
export function buildShoppingList(selections:readonly Selection[],pantry:readonly PantryItem[]=[],prices:PriceOverrides={}):ShoppingResult {
  const required=new Map<string,PantryItem>(),stock=new Map<string,PantryItem>()
  for (const {recipe,people} of selections) {
    if(!Number.isFinite(people)||people<=0||!Number.isFinite(recipe.servings)||recipe.servings<=0) throw Error('用餐人数和菜谱默认人数必须大于零')
    const factor=people/recipe.servings
    for(const item of recipe.ingredients) accumulate(required,{...item,amount:item.amount*factor})
  }
  for(const item of pantry) accumulate(stock,item)
  const groups=new Map<string,ShoppingLine[]>()
  const items:ShoppingLine[]=[],missingPrices:string[]=[]
  let total=0,purchase=0
  for(const [key,q] of required) {
    const info=ingredientInfo(q.name), rate=costRate(info,q.unit,prices)
    const household=q.name==='水'&&q.unit==='毫升'
    const available=rounded(stock.get(key)?.amount??0)
    const raw=rounded(q.amount)
    const fromPantry=rounded(Math.min(raw,available))
    let toBuy=household?0:rounded(Math.max(0,raw-fromPantry))
    if(q.unit==='个'||q.unit==='片') toBuy=Math.ceil(toBuy)
    const full=rate?q.amount*rate.yuan/rate.basis:null
    const buy=toBuy===0?0:rate?toBuy*rate.yuan/rate.basis:null
    if(full!==null)total+=full
    else missingPrices.push(key)
    if(buy!==null)purchase+=buy
    const line:ShoppingLine={name:q.name,category:info.category,unit:q.unit,required:raw,available,fromPantry,toBuy,
      cost:full===null?null:money(full),purchaseCost:buy===null?null:money(buy),unitPrice:rate?.yuan??null,
      priceUnit:rate?(rate.basis===1?'每':'每'+rate.basis)+q.unit:'',storage:info.storage,
      substitutes:info.substitutes,aliases:info.aliases,household}
    items.push(line)
    if(toBuy>0) { const arr=groups.get(info.category)??[];arr.push(line);groups.set(info.category,arr) }
  }
  return {items,groups:[...groups].map(([category,items])=>({category,items})),totalCost:money(total),purchaseCost:money(purchase),missingPrices}
}
export function estimateRecipe(recipe:CostRecipe,people:number=recipe.servings,prices:PriceOverrides={}):ShoppingResult {
  return buildShoppingList([{recipe,people}],[],prices)
}
export function deductPantry<T extends PantryItem>(pantry:readonly T[],selections:readonly Selection[]):{ok:boolean;pantry:T[];shortages:ShoppingLine[]} {
  const list=buildShoppingList(selections,pantry)
  const shortages=list.items.filter(line=>line.toBuy>0)
  if(shortages.length) return {ok:false,pantry:pantry.map(p=>({...p})),shortages}
  const remaining=new Map(list.items.filter(l=>!l.household).map(l=>[l.name+'|'+l.unit,l.required]))
  const next=pantry.map(item=>{
    const q=normalizeQuantity(item.name,item.amount,item.unit)
    const key=q.name+'|'+q.unit, required=remaining.get(key)??0
    if(required<=0||q.amount===0)return {...item}
    const take=Math.min(q.amount,required)
    remaining.set(key,rounded(required-take))
    return {...item,amount:rounded(item.amount*(q.amount-take)/q.amount)}
  })
  return {ok:true,pantry:next,shortages:[]}
}
