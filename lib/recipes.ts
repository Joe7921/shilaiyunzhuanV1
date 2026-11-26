/**
 * 原创家常菜做法。kcal 为整份原料与用油的粗略估算，不是称重测定值。
 * 人均热量 = kcal / servings；实际结果随品牌、去骨方式与烹饪损耗变化。
 * 调味品配方可能不同，过敏者仍需检查所用包装的配料和过敏原标识。
 */
import desserts from "./catalog/desserts.json";
import additions from "./catalog/recipes.json";

export type OriginalRecipe = {
  id: string;
  title: string;
  description: string;

  color: 'red' | 'yellow' | 'green' | 'orange' | 'white';
  colorName: string;
  luckyIngredient: string;
  time: number;
  difficulty: '简单' | '进阶';
  servings: number;
  kcal: number;
  tags: string[];
  allergens: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  steps: string[];
  tip: string;
  image?: string;
};

const originalRecipes: OriginalRecipe[] = [
  {
    id: 'tomato-eggs',
    title: '番茄炒蛋',
    description: '酸甜番茄裹住软嫩鸡蛋，平凡的一餐也会发光。',

    color: 'red',
    colorName: '番茄红',
    luckyIngredient: '番茄',
    time: 15,
    difficulty: '简单',
    servings: 2,
    kcal: 390,
    tags: ['快手菜', '下饭菜'],
    allergens: ['蛋'],
    ingredients: [
      { name: '番茄', amount: 300, unit: '克' },
      { name: '鸡蛋', amount: 2, unit: '个' },
      { name: '食用油', amount: 15, unit: '克' },
      { name: '小葱', amount: 5, unit: '克' },
      { name: '白糖', amount: 3, unit: '克' },
      { name: '盐', amount: 2, unit: '克' },
    ],
    steps: [
      '番茄洗净切小块，小葱切葱花。鸡蛋打散，加入一半的盐拌匀。',
      '平底锅中火烧热，倒入约三分之二的油。倒入蛋液，待边缘凝固后轻推成块，全部凝固即盛出。',
      '锅中加入剩余的油，放入番茄翻炒。加入糖和剩余的盐，炒至番茄变软、汤汁析出。',
      '将鸡蛋倒回锅中，轻轻翻匀，让每块鸡蛋沾上番茄汁。撒葱花，关火装盘。',
    ],
    tip: '喜欢汤汁拌饭，可以在炒番茄时加两勺水。鸡蛋先盛出，口感更嫩。',
  },
  {
    id: 'teriyaki-chicken',
    title: '照烧鸡腿饭',
    description: '亮晶晶的咸甜酱汁，配上一碗热米饭，快乐很具体。',

    color: 'yellow',
    colorName: '蜂蜜金',
    luckyIngredient: '蜂蜜',
    time: 30,
    difficulty: '简单',
    servings: 2,
    kcal: 1050,
    tags: ['一人食', '下饭菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '去骨鸡腿肉', amount: 300, unit: '克' },
      { name: '熟米饭', amount: 300, unit: '克' },
      { name: '西兰花', amount: 150, unit: '克' },
      { name: '蜂蜜', amount: 10, unit: '克' },
      { name: '生抽', amount: 20, unit: '毫升' },
      { name: '料酒', amount: 10, unit: '毫升' },
      { name: '食用油', amount: 5, unit: '克' },
      { name: '姜', amount: 5, unit: '克' },
    ],
    steps: [
      '鸡腿肉擦干，较厚的部位横切展开，使厚度均匀。蜂蜜、生抽、料酒与等量清水拌成酱汁。',
      '西兰花掰成小朵，放入沸水中煮至熟，捞出沥水。生鸡肉接触过的刀板和手要清洁后再处理熟食。',
      '锅中放油和姜片，鸡皮面朝下放入，中小火煎至上色，再翻面煎。',
      '倒入酱汁，盖盖小火焖熟，中途翻面。确认鸡肉最厚处中心温度达到74℃，再开盖稍收汁。',
      '鸡肉静置片刻后切条，与西兰花放在热米饭上，淋上锅中酱汁。',
    ],
    tip: '酱汁含蜂蜜，收汁时用小火并留意锅底。热量包含米饭和配菜。',
  },
  {
    id: 'shrimp-broccoli',
    title: '鲜虾西兰花',
    description: '一口鲜甜，一口清爽，给忙碌的一天添一点绿。',

    color: 'green',
    colorName: '西兰花绿',
    luckyIngredient: '西兰花',
    time: 18,
    difficulty: '简单',
    servings: 2,
    kcal: 350,
    tags: ['快手菜', '轻负担'],
    allergens: ['虾'],
    ingredients: [
      { name: '虾仁', amount: 200, unit: '克' },
      { name: '西兰花', amount: 250, unit: '克' },
      { name: '大蒜', amount: 10, unit: '克' },
      { name: '食用油', amount: 10, unit: '克' },
      { name: '盐', amount: 2, unit: '克' },
      { name: '黑胡椒', amount: 1, unit: '克' },
    ],
    steps: [
      '冷冻虾仁提前在冰箱冷藏室解冻，去虾线并擦干。西兰花切小朵，大蒜切末。',
      '沸水中放西兰花，煮至颜色鲜绿、花梗可以轻松咬断，捞出沥水。',
      '锅中放油，中小火炒香蒜末。加入虾仁翻炒，直到虾肉完全不透明、变得紧实。',
      '放入西兰花，加入盐和黑胡椒，翻炒均匀即可。锅太干时加少量热水。',
    ],
    tip: '西兰花先焯熟，和虾仁合炒时就不用久炒。虾仁有异味或解冻状态不明时不要使用。',
  },
  {
    id: 'chicken-curry',
    title: '日式咖喱鸡',
    description: '软糯土豆和浓浓咖喱，把小厨房变成温暖补给站。',

    color: 'orange',
    colorName: '胡萝卜橙',
    luckyIngredient: '胡萝卜',
    time: 35,
    difficulty: '简单',
    servings: 2,
    kcal: 1230,
    tags: ['下饭菜', '一人食'],
    allergens: ['小麦', '奶', '大豆'],
    ingredients: [
      { name: '去骨鸡腿肉', amount: 250, unit: '克' },
      { name: '土豆', amount: 200, unit: '克' },
      { name: '胡萝卜', amount: 100, unit: '克' },
      { name: '洋葱', amount: 100, unit: '克' },
      { name: '咖喱块', amount: 40, unit: '克' },
      { name: '熟米饭', amount: 300, unit: '克' },
      { name: '食用油', amount: 8, unit: '克' },
    ],
    steps: [
      '鸡肉切均匀小块，土豆、胡萝卜切小块，洋葱切丝。生肉与蔬菜使用分开的刀板。',
      '锅中放油，先炒软洋葱，再放鸡肉炒至表面变色。加入土豆和胡萝卜翻炒。',
      '倒入刚没过食材的热水，煮开后转小火，煮至土豆可用筷子轻松穿透，鸡肉中心温度达到74℃。',
      '暂时关火，放入切碎的咖喱块，搅拌至完全溶化。再开小火，边搅拌边煮至酱汁浓稠。',
      '盛到热米饭旁。过稠可少量加热水，咖喱块已有咸味，尝味后再决定是否需要调味。',
    ],
    tip: '咖喱块的过敏原因品牌而异，使用前核对包装。热量包含米饭。',
  },
  {
    id: 'pumpkin-soup',
    title: '奶香南瓜浓汤',
    description: '像把一小片阳光装进碗里，绵绵的、暖暖的。',

    color: 'orange',
    colorName: '南瓜橙',
    luckyIngredient: '南瓜',
    time: 25,
    difficulty: '简单',
    servings: 2,
    kcal: 310,
    tags: ['暖心汤', '轻负担'],
    allergens: ['奶'],
    ingredients: [
      { name: '南瓜', amount: 350, unit: '克' },
      { name: '纯牛奶', amount: 200, unit: '毫升' },
      { name: '洋葱', amount: 50, unit: '克' },
      { name: '黄油', amount: 8, unit: '克' },
      { name: '盐', amount: 1, unit: '克' },
      { name: '黑胡椒', amount: 0.5, unit: '克' },
    ],
    steps: [
      '南瓜去皮去籽后称重切小块，洋葱切末。',
      '小锅中用小火融化黄油，放入洋葱炒软，再加入南瓜翻炒。',
      '加水至南瓜高度的一半，盖盖小火煮软。用勺背压碎，或稍降温后用手持搅拌棒打细。',
      '加入牛奶，边搅拌边加热至均匀冒小泡。加入盐和黑胡椒，调整到喜欢的稠度。',
    ],
    tip: '不要把滚烫汤汁倒入不支持热饮的密闭料理杯。喜欢有颗粒的口感，直接用勺子压碎就好。',
  },
  {
    id: 'tomato-beef',
    title: '番茄肥牛暖锅',
    description: '酸甜汤底和嫩嫩肥牛，适合想认真犒劳自己的晚上。',

    color: 'red',
    colorName: '番茄红',
    luckyIngredient: '番茄',
    time: 20,
    difficulty: '简单',
    servings: 2,
    kcal: 760,
    tags: ['暖心汤', '下饭菜', '快手菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '肥牛片', amount: 250, unit: '克' },
      { name: '番茄', amount: 350, unit: '克' },
      { name: '金针菇', amount: 150, unit: '克' },
      { name: '洋葱', amount: 50, unit: '克' },
      { name: '生抽', amount: 10, unit: '毫升' },
      { name: '食用油', amount: 5, unit: '克' },
      { name: '盐', amount: 1, unit: '克' },
      { name: '小葱', amount: 5, unit: '克' },
    ],
    steps: [
      '番茄切块，洋葱切丝，金针菇切去根部并分散洗净。肥牛按包装要求解冻。',
      '锅中加油，炒软洋葱，倒入番茄炒出汁。加入约500毫升热水，煮开后小火煮成番茄汤底。',
      '放入金针菇煮熟，再将肥牛片逐片放入，轻轻拨散，保持汤底沸腾。',
      '继续煮至肥牛片全部熟透，加入生抽和盐调味，撒葱花后盛出。',
    ],
    tip: '肥牛片尽量分开下锅，成团的肉内部不容易熟。热量不包含另配的米饭。',
  },
  {
    id: 'pan-seared-salmon',
    title: '柠檬香煎三文鱼',
    description: '一片金黄鱼排，配一点清亮的柠檬香。',

    color: 'yellow',
    colorName: '柠檬黄',
    luckyIngredient: '柠檬',
    time: 20,
    difficulty: '进阶',
    servings: 1,
    kcal: 480,
    tags: ['一人食', '快手菜'],
    allergens: ['鱼'],
    ingredients: [
      { name: '三文鱼排', amount: 180, unit: '克' },
      { name: '西兰花', amount: 150, unit: '克' },
      { name: '柠檬', amount: 30, unit: '克' },
      { name: '食用油', amount: 5, unit: '克' },
      { name: '盐', amount: 1, unit: '克' },
      { name: '黑胡椒', amount: 0.5, unit: '克' },
    ],
    steps: [
      '三文鱼检查并去除鱼刺，用厨房纸擦干。两面撒盐和黑胡椒。',
      '西兰花切小朵，放入沸水煮熟，捞出沥水。柠檬一部分切片，一部分留着挤汁。',
      '不粘锅中火预热后放油，鱼皮朝下放入。待鱼皮定型并上色，再轻轻翻面。',
      '转中小火继续煎，较厚的鱼排可盖盖帮助熟透。用温度计确认最厚处达到63℃。',
      '鱼排装盘，配西兰花和柠檬片，吃前挤少许柠檬汁。',
    ],
    tip: '鱼排刚下锅时不要频繁翻动，定型后更容易完整翻面。此做法为全熟鱼排。',
  },
  {
    id: 'mushroom-pasta',
    title: '蒜香蘑菇意面',
    description: '蒜香和蘑菇香在锅里碰头，简单也能很有仪式感。',

    color: 'white',
    colorName: '蘑菇白',
    luckyIngredient: '白蘑菇',
    time: 20,
    difficulty: '简单',
    servings: 1,
    kcal: 440,
    tags: ['快手菜', '一人食'],
    allergens: ['小麦'],
    ingredients: [
      { name: '干意大利面', amount: 80, unit: '克' },
      { name: '白蘑菇', amount: 150, unit: '克' },
      { name: '大蒜', amount: 12, unit: '克' },
      { name: '橄榄油', amount: 10, unit: '克' },
      { name: '小葱', amount: 5, unit: '克' },
      { name: '盐', amount: 2, unit: '克' },
      { name: '黑胡椒', amount: 1, unit: '克' },
    ],
    steps: [
      '蘑菇洗净切片，蒜切薄片，小葱切末。锅中烧开足量水，加入一半盐。',
      '按意面包装时间煮面，出锅前尝一根确认熟度，保留一小杯煮面水。',
      '平底锅放橄榄油，中小火炒香蒜片，加入蘑菇翻炒至熟、表面略微上色。',
      '放入沥水的意面，加两三勺煮面水，充分拌匀。加入剩余盐、黑胡椒和葱末，尝味后装盘。',
    ],
    tip: '蒜片浅金黄就够了，炒黑会发苦。煮面水少量多次加，能让面条不干。',
  },
  {
    id: 'scallion-noodles',
    title: '葱油拌面',
    description: '几根小葱的香气，就能把普通的一碗面变得很满足。',

    color: 'green',
    colorName: '小葱绿',
    luckyIngredient: '小葱',
    time: 15,
    difficulty: '简单',
    servings: 1,
    kcal: 460,
    tags: ['快手菜', '一人食'],
    allergens: ['小麦', '大豆'],
    ingredients: [
      { name: '干面条', amount: 90, unit: '克' },
      { name: '小葱', amount: 30, unit: '克' },
      { name: '食用油', amount: 12, unit: '克' },
      { name: '生抽', amount: 12, unit: '毫升' },
      { name: '老抽', amount: 3, unit: '毫升' },
      { name: '白糖', amount: 3, unit: '克' },
    ],
    steps: [
      '小葱洗净后充分擦干，切成长段，葱白和葱绿分开放。生抽、老抽和糖在小碗中拌匀。',
      '小锅放油和葱白，用小火慢慢煎香，再加入葱绿，煎至葱段金黄但不焦黑。',
      '关火并稍放凉，将调好的酱汁沿锅边慢慢加入，轻轻搅拌，注意热油飞溅。',
      '面条按包装说明煮熟，沥水后倒入葱油酱汁中拌匀。先用部分酱汁，按口味再加。',
    ],
    tip: '葱段一定要擦干再下油锅。这是一份主食，可以另配熟蔬菜或鸡蛋。',
  },
  {
    id: 'korean-pork',
    title: '韩式香煎五花肉',
    description: '微焦的肉边、清脆的生菜，一卷就是一口小幸福。',

    color: 'green',
    colorName: '生菜绿',
    luckyIngredient: '生菜',
    time: 25,
    difficulty: '简单',
    servings: 2,
    kcal: 1250,
    tags: ['下饭菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '五花肉', amount: 250, unit: '克' },
      { name: '生菜', amount: 200, unit: '克' },
      { name: '大蒜', amount: 15, unit: '克' },
      { name: '生抽', amount: 12, unit: '毫升' },
      { name: '辣椒粉', amount: 3, unit: '克' },
      { name: '白糖', amount: 4, unit: '克' },
      { name: '米醋', amount: 8, unit: '毫升' },
    ],
    steps: [
      '五花肉切约3毫米薄片。生菜逐片洗净沥干，放到干净盘中；生肉与即食生菜分开处理。',
      '大蒜切片。生抽、辣椒粉、糖和米醋拌成蘸汁。',
      '冷锅铺入肉片，不额外放油，中小火煎出油脂，分批翻面煎至熟透。',
      '倒出多余油脂，放入蒜片煎熟，最后将肉片边缘煎到喜欢的微焦程度。',
      '用生菜包住熟肉和蒜片，蘸少许酱汁食用。夹生肉和熟肉的筷子要分开。',
    ],
    tip: '热量按原料粗估；煎出并倒掉的油脂会改变实际摄入量。喜欢焦脆口感可在熟透后短暂加火。',
  },
  {
    id: 'shrimp-fried-rice',
    title: '玉米虾仁炒饭',
    description: '金黄玉米、鲜甜虾仁，颗颗米饭都有自己的快乐。',

    color: 'yellow',
    colorName: '玉米黄',
    luckyIngredient: '玉米粒',
    time: 15,
    difficulty: '简单',
    servings: 1,
    kcal: 580,
    tags: ['快手菜', '一人食'],
    allergens: ['虾', '蛋'],
    ingredients: [
      { name: '熟米饭', amount: 180, unit: '克' },
      { name: '虾仁', amount: 100, unit: '克' },
      { name: '玉米粒', amount: 60, unit: '克' },
      { name: '鸡蛋', amount: 1, unit: '个' },
      { name: '胡萝卜', amount: 40, unit: '克' },
      { name: '食用油', amount: 8, unit: '克' },
      { name: '盐', amount: 1.5, unit: '克' },
      { name: '小葱', amount: 5, unit: '克' },
    ],
    steps: [
      '虾仁按需切小块，胡萝卜切小丁，小葱切末，鸡蛋打散。用新煮米饭或及时冷藏、妥善保存的米饭。',
      '锅中放一半油，倒入蛋液，炒至完全凝固后盛出。',
      '加入剩余油，先炒胡萝卜和玉米，必要时加一勺水焖熟；再放虾仁炒至完全不透明。',
      '加入米饭并压散，翻炒至整锅均匀热透。倒回鸡蛋，加入盐和葱末拌匀，立即食用。',
    ],
    tip: '不要使用长时间放在室温下的剩饭。炒饭不需要很大火，先把米饭拨散更省力。',
  },
  {
    id: 'cola-wings',
    title: '可乐鸡翅',
    description: '咸甜酱汁抱住鸡翅，是记忆里最容易期待的一道菜。',

    color: 'yellow',
    colorName: '生姜黄',
    luckyIngredient: '姜',
    time: 35,
    difficulty: '简单',
    servings: 2,
    kcal: 950,
    tags: ['下饭菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '鸡翅中', amount: 400, unit: '克' },
      { name: '含糖可乐', amount: 250, unit: '毫升' },
      { name: '生抽', amount: 15, unit: '毫升' },
      { name: '姜', amount: 10, unit: '克' },
      { name: '料酒', amount: 10, unit: '毫升' },
      { name: '食用油', amount: 5, unit: '克' },
    ],
    steps: [
      '鸡翅擦干，两面各划一两刀，姜切片。处理完生鸡翅后清洁手和刀板。',
      '锅中放油，中小火将鸡翅两面煎至微黄，加入姜片。',
      '倒入料酒、生抽和可乐，液体不足时补少量热水，煮开后盖盖小火焖。',
      '焖至鸡翅熟透，使用温度计确认最厚的肉处达到74℃，探针不要碰到骨头。',
      '开盖转中火收汁，并不断翻动。酱汁能薄薄挂在鸡翅上就关火，避免糖汁烧焦。',
    ],
    tip: '不同大小的鸡翅熟得快慢不同，以实际熟度为准。热量按带骨原料粗估，不含米饭。',
  },
  {
    id: 'mushroom-chicken',
    title: '香菇滑鸡',
    description: '香菇吸满鲜香汤汁，拌饭刚刚好。',

    color: 'white',
    colorName: '香菇白',
    luckyIngredient: '鲜香菇',
    time: 30,
    difficulty: '简单',
    servings: 2,
    kcal: 650,
    tags: ['下饭菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '去骨鸡腿肉', amount: 300, unit: '克' },
      { name: '鲜香菇', amount: 150, unit: '克' },
      { name: '姜', amount: 8, unit: '克' },
      { name: '生抽', amount: 15, unit: '毫升' },
      { name: '淀粉', amount: 6, unit: '克' },
      { name: '食用油', amount: 8, unit: '克' },
      { name: '料酒', amount: 10, unit: '毫升' },
      { name: '小葱', amount: 5, unit: '克' },
    ],
    steps: [
      '鸡肉切均匀小块，拌入生抽、料酒和淀粉，放冰箱冷藏腌10分钟。香菇洗净切片，姜切丝。',
      '热锅放油，炒香姜丝，加入鸡肉铺开，稍定型后翻炒至表面变色。',
      '加入香菇，翻炒后加小半碗热水，煮开后盖盖小火焖。',
      '确认鸡肉最厚处中心达到74℃，再开盖稍稍收汁。撒葱花，保留一点汤汁装盘。',
    ],
    tip: '生抽已有盐分，出锅前尝一下汤汁再调咸淡。腌过生鸡肉的碗不要直接装熟菜。',
  },
  {
    id: 'mapo-tofu',
    title: '家常麻婆豆腐',
    description: '麻辣鲜香、软软热热，一勺就能唤醒胃口。',

    color: 'red',
    colorName: '辣椒红',
    luckyIngredient: '辣椒粉',
    time: 25,
    difficulty: '简单',
    servings: 2,
    kcal: 630,
    tags: ['下饭菜'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '嫩豆腐', amount: 400, unit: '克' },
      { name: '猪肉末', amount: 100, unit: '克' },
      { name: '豆瓣酱', amount: 15, unit: '克' },
      { name: '辣椒粉', amount: 1, unit: '克' },
      { name: '花椒粉', amount: 1, unit: '克' },
      { name: '大蒜', amount: 10, unit: '克' },
      { name: '淀粉', amount: 6, unit: '克' },
      { name: '食用油', amount: 8, unit: '克' },
      { name: '小葱', amount: 5, unit: '克' },
    ],
    steps: [
      '豆腐切小方块，蒜切末、葱切末。淀粉用约三倍清水调匀。',
      '锅中放油，加入肉末炒散，继续炒至熟透，再放蒜末、豆瓣酱和辣椒粉，小火炒香。',
      '加入约200毫升热水，煮开后轻轻放入豆腐，小火煮至豆腐热透、入味。',
      '再次搅匀淀粉水，分两次沿锅边加入，每次加入后轻推锅中食材并煮开，观察汤汁稠度。',
      '撒花椒粉和葱花，轻轻拌匀装盘。豆瓣酱较咸，通常不必额外加盐。',
    ],
    tip: '不太吃辣可减少辣椒粉和豆瓣酱。豆瓣酱配料各异，请核对所用品牌的过敏原。',
  },
  {
    id: 'cheese-omelette',
    title: '芝士蔬菜蛋饼',
    description: '软软蛋饼藏着一点拉丝惊喜，早餐晚餐都合适。',

    color: 'yellow',
    colorName: '蛋黄黄',
    luckyIngredient: '鸡蛋',
    time: 15,
    difficulty: '简单',
    servings: 1,
    kcal: 370,
    tags: ['快手菜', '一人食'],
    allergens: ['蛋', '奶'],
    ingredients: [
      { name: '鸡蛋', amount: 2, unit: '个' },
      { name: '马苏里拉芝士', amount: 30, unit: '克' },
      { name: '菠菜', amount: 80, unit: '克' },
      { name: '纯牛奶', amount: 20, unit: '毫升' },
      { name: '食用油', amount: 5, unit: '克' },
      { name: '盐', amount: 1, unit: '克' },
      { name: '黑胡椒', amount: 0.5, unit: '克' },
    ],
    steps: [
      '菠菜洗净，在沸水中烫熟，捞出稍放凉，挤去多余水分并切碎。',
      '鸡蛋打散，加入牛奶、盐和黑胡椒，拌入菠菜碎。',
      '不粘锅涂油，小火加热后倒入蛋液，摊成均匀的圆饼。',
      '底部定型后撒芝士，盖盖小火加热，直到表面蛋液完全凝固、芝士融化。将蛋饼对折装盘。',
    ],
    tip: '全程小火更容易控制熟度。锅较小、蛋饼较厚时，要留足时间让中心也凝固。',
  },
  {
    id: 'cucumber-tofu',
    title: '黄瓜拌豆腐',
    description: '清清爽爽的一小碗，给浓郁口味按下清新键。',

    color: 'green',
    colorName: '黄瓜绿',
    luckyIngredient: '黄瓜',
    time: 12,
    difficulty: '简单',
    servings: 2,
    kcal: 310,
    tags: ['快手菜', '轻负担'],
    allergens: ['大豆', '小麦'],
    ingredients: [
      { name: '嫩豆腐', amount: 300, unit: '克' },
      { name: '黄瓜', amount: 200, unit: '克' },
      { name: '大蒜', amount: 8, unit: '克' },
      { name: '生抽', amount: 12, unit: '毫升' },
      { name: '米醋', amount: 10, unit: '毫升' },
      { name: '食用油', amount: 5, unit: '克' },
      { name: '白糖', amount: 2, unit: '克' },
    ],
    steps: [
      '豆腐切块，放沸水中充分加热至中心热透，捞出沥水，放到干净容器中稍放凉。',
      '黄瓜彻底洗净，用处理即食食材的干净刀板切小块。大蒜剁成蒜末。',
      '将生抽、米醋、食用油、白糖和蒜末搅匀，调成拌汁。',
      '豆腐和黄瓜放入碗中，淋拌汁后轻轻拌匀，现拌现吃。暂不食用时及时冷藏。',
    ],
    tip: '豆腐容易碎，拌的时候用勺子轻推即可。清爽拌菜可以配一份热主食。',
  },
];

export type Recipe = OriginalRecipe & {
  aliases: string[]; cuisine: string; category: string; tastes: string[]; seasons: string[];
  festivals: string[]; tools: string[]; image: string; imageCredit: string; kcalBasis?:string; imageSource?:string; imageLicenseUrl?:string; activeMinutes?:number; recipeSource?:string; recipePublisher?:string;
  vegetarian: boolean; series?: string; tradition?: string; alcohol?: boolean; alternativeId?: string;
};
const originalDetails: Record<string, [string, string, string, string, string[]]> = {
  'tomato-eggs': ['中国家常','热菜','酸甜','炒锅',['西红柿炒鸡蛋','番茄炒鸡蛋']],
  'teriyaki-chicken': ['日本料理','主食','咸甜','平底锅',[]],
  'shrimp-broccoli': ['中国家常','热菜','鲜甜','炒锅',['西兰花炒虾仁']],
  'chicken-curry': ['日本料理','主食','咖喱','炖锅',['日式鸡肉咖喱饭']],
  'pumpkin-soup': ['西式家常','汤羹','奶香','汤锅',['牛奶南瓜汤']],
  'tomato-beef': ['中国家常','汤羹','酸鲜','小汤锅',[]],
  'pan-seared-salmon': ['西式家常','热菜','清鲜','平底锅',['香煎三文鱼']],
  'mushroom-pasta': ['意大利菜','主食','蒜香','煮锅、平底锅',[]],
  'scallion-noodles': ['本帮菜','主食','葱香','煮锅、炒锅',['上海葱油拌面']],
  'korean-pork': ['韩国料理','热菜','咸香','平底锅',[]],
  'shrimp-fried-rice': ['中国家常','主食','鲜甜','炒锅',[]],
  'cola-wings': ['中国家常','热菜','咸甜','平底锅',[]],
  'mushroom-chicken': ['粤菜','热菜','鲜香','炒锅',[]],
  'mapo-tofu': ['川菜','热菜','麻辣','炒锅',['麻婆豆腐']],
  'cheese-omelette': ['西式早餐','早餐','奶香','平底锅',[]],
  'cucumber-tofu': ['中国家常','凉菜','清爽','煮锅',[]],
};
export const recipes: Recipe[] = [
  ...originalRecipes.map(r => {
    const [cuisine,category,taste,tool,aliases]=originalDetails[r.id];
    const allergens=r.allergens.includes('虾')?[...r.allergens,'甲壳类']:r.allergens;
    const vegetarian=['tomato-eggs','pumpkin-soup','mushroom-pasta','scallion-noodles','cheese-omelette','cucumber-tofu'].includes(r.id);
    return {...r,vegetarian,allergens,cuisine,category,aliases,tastes:[taste],tools:tool.split('、'),seasons:['春','夏','秋','冬'],
      festivals:[],image:'/images/dishes/'+r.id+'.webp',imageCredit:'AI 生成 · 写实美食配图'};
  }),
  ...(additions as Recipe[]),
  ...(desserts as Recipe[])
];
export type Personality = {
  id: 'cozy' | 'bold' | 'fresh' | 'quick';
  title: string;

  description: string;
  tags: string[];
  recipeIds: string[];
};

/** 趣味口味偏好结果，不作为科学人格或健康测评。 */
export const personalities: Personality[] = [
  {
    id: 'cozy',
    title: '暖胃治愈派',

    description: '你喜欢熟悉的味道和热气腾腾的安心感。再忙的一天，也值得用一碗暖汤好好收尾。',
    tags: ['暖心汤', '下饭菜'],
    recipeIds: ['pumpkin-soup', 'tomato-beef', 'chicken-curry', 'mushroom-chicken'],
  },
  {
    id: 'bold',
    title: '浓香冒险派',

    description: '你希望每一口都有点意思，咸香、酸甜、微辣都能让普通一餐变成小小探险。',
    tags: ['下饭菜'],
    recipeIds: ['mapo-tofu', 'korean-pork', 'cola-wings', 'teriyaki-chicken'],
  },
  {
    id: 'fresh',
    title: '清新自然派',

    description: '你会留意食材本来的味道，喜欢清爽和鲜甜。简单的搭配，也能吃出自己的节奏。',
    tags: ['轻负担', '快手菜'],
    recipeIds: ['shrimp-broccoli', 'cucumber-tofu', 'pan-seared-salmon', 'pumpkin-soup'],
  },
  {
    id: 'quick',
    title: '快乐快手派',

    description: '你相信好吃不必复杂。一口锅、几样食材，就能给自己变出一份刚刚好的快乐。',
    tags: ['快手菜', '一人食'],
    recipeIds: ['tomato-eggs', 'cheese-omelette', 'scallion-noodles', 'shrimp-fried-rice'],
  },
];
