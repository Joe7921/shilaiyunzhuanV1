import type { Recipe } from '@/lib/recipes';

type Lesson = {
  name: string;
  cue: RegExp;
  observation: string;
  adjustment: string;
};
const lessons: Lesson[] = [
  {name:'糖浆火候',cue:/拔丝|浅琥珀|糖霜|糖浆.*(?:浓稠|气泡|变色)|反沙/,observation:'糖在收浓后变色很快，最后一段最容易错过。',adjustment:'先把成品盘摆好，把步骤写到的颜色或气泡当作离火信号。'},
  {name:'发酵判断',cue:/发至|发酵|二次发|两倍大|两倍大小/,observation:'环境温度不同，面团膨胀的速度会变。',adjustment:'在容器上记下起始高度，把体积变化和配方时长一起观察。'},
  {name:'包馅成形',cue:/包入|捏紧|收口|封口|包紧|包粽|包成|包住馅/,observation:'馅料挤到边缘，包裹处容易松开。',adjustment:'先试包一份，给收口留出余量；边缘粘上馅时先擦净再合拢。'},
  {name:'温度与熟度',cue:/(?:中心|最厚处|内部)(?:温度|熟透|凝固|全熟|完全|达到|至|至少|约|≥)|[0-9]+\s*[℃°]\s*C?.*(?:凝固|熟透)/,observation:'表面颜色和中心的熟度可能不同。',adjustment:'先找最厚的一块，按这一步明确写出的中心熟度信号检查，再决定是否起锅。'},
  {name:'乳化与调匀',cue:/乳化|油水分离|边.*边.*(?:倒油|加油)|分次.*(?:黄油|加油|蛋液)|搅拌到油.*融合/,observation:'混合太快，液体容易出现油水分层或颗粒。',adjustment:'分次操作，每一次都等前一部分混匀，再继续加入。'},
  {name:'翻面定型',cue:/翻面|翻到底面|翻转|翻到另一面|反面再煎/,observation:'底层还没定型时翻动，表皮容易粘锅或破裂。',adjustment:'先从一角轻轻试铲；能整片移动再翻面，保留形状。'},
  {name:'收汁与勾芡',cue:/收汁|收浓|勾芡|薄芡|挂汁|挂住|挂在|水淀粉.*(?:倒|淋)|淀粉水.*(?:倒|淋)|汤汁.*变稠/,observation:'汁从挂不住到太稠，往往只差最后一会儿。',adjustment:'临近收尾时少量、多次观察，能薄薄裹住食材就先停下检查。'},
  {name:'揉面与擀制',cue:/揉成|揉至|揉到|擀至|擀成|擀薄|擀面|醒面|松弛|醒\s?\d/,observation:'面团厚薄或松弛程度不同，会影响成形。',adjustment:'先整理成均匀小份，再照这一步检查面团的厚薄或手感。'},
  {name:'打发与翻拌',cue:/打发|翻拌|消泡|纹路清晰|尖角/,observation:'搅拌过度会改变面糊或奶油的状态。',adjustment:'停下来观察这一步要求的状态，再决定是否继续搅拌。'},
  {name:'烤箱上色',cue:/预热.*(?:烤箱|℃|°C)|放入烤箱|入烤箱|烤约|烤\s?\d|烤到|烤至/,observation:'不同烤箱的着色速度会不同。',adjustment:'从配方时间区间的前端开始看颜色，结合这一步写出的内部状态判断。'},
  {name:'焯水与沥干',cue:/焯|汆|飞水|过凉后.*(?:沥|挤)|挤干|攥干/,observation:'预处理后的余水会带进下一步，稀释味道。',adjustment:'按步骤完成预处理，转入下一口锅或拌料前留出沥水时间。'},
  {name:'蒸制火候',cue:/上屉|放蒸屉|蒸\s?\d|蒸约|蒸至|蒸到|蒸熟|蒸锅.*(?:放|入)|水开后蒸/,observation:'切块厚薄和摆放密度会影响蒸熟的时间。',adjustment:'尽量均匀铺开，选较厚的一块检查菜谱给出的状态。'},
  {name:'慢炖火候',cue:/小火(?:慢)?(?:炖|煨|煲)|炖\s?\d|炖约|炖至|煨约|微沸|微微冒泡|轻轻冒泡|小火.*盖.{0,3}炖/,observation:'持续大滚可能让液体收得过快。',adjustment:'观察锅面气泡和剩余汤量，以这一步给出的质地判断是否完成。'},
  {name:'分批快炒',cue:/炒散|炒匀|炒至|翻炒|爆香|煸香|炒香|快炒|滑散/,observation:'食材全堆在一起时，锅温容易骤降。',adjustment:'先把待下锅的配料放手边，按原步骤的先后顺序翻炒。'},
  {name:'冷却定型',cue:/冷藏.*(?:定型|凝固|小时|成形)|凝固后|放凉.*脱模|完全冷却|冻至/,observation:'还未定型就脱模或切块，边缘容易散。',adjustment:'留足菜谱写的静置时间，先检查边缘和中心，再做切分。'},
  {name:'调浆与增稠',cue:/调成糊|拌成糊|面糊|调浆|奶糊|糊化|搅到无干粉/,observation:'干料没散开会留下粉团，影响口感。',adjustment:'先刮开碗底的干粉，混匀后再按配方继续加热或成形。'},
  {name:'浸泡与回软',cue:/泡发|浸软|泡软|浸泡|浸\s?\d|提前泡|泡开/,observation:'食材回软程度不同，后续加热时间也会变化。',adjustment:'同时看时间和实际柔软程度，按原菜谱处理浸泡液。'},
  {name:'煮面与控水',cue:/煮面|煮至.*无硬芯|煮到.*无硬芯|米粉.*煮|面条.*煮|面.*捞起|面.*沥干/,observation:'捞起后若久放，面条容易粘成团。',adjustment:'在煮面时备好汤碗或调味汁，照原步骤把握捞出的时机。'},
  {name:'熬煮与过滤',cue:/滤出|滤去|过滤|过筛|滤掉|滤籽/,observation:'倒得太快，细渣容易随液体穿过。',adjustment:'备好接液的容器，分次过滤，再检查原菜谱要求的清澈或细腻程度。'},
  {name:'调味与拌合',cue:/尝味|尝咸淡|搅匀|拌匀|调成.*汁|凉拌|调散|轻拌|压成泥|搅打|搅碎|乳酪.*混合/,observation:'拌得不均时，第一口和最后一口的味道会不同。',adjustment:'从碗底翻起或围着边缘搅匀，最后按原菜谱收尾。'},
  {name:'分层与装配',cue:/叠放|交叠|分层|分杯|分装|沿.*倒入|卷紧|铺入|铺平|摆在|摆放/,observation:'层次或份量不均会影响每一份的口感。',adjustment:'先分好每份材料，按这一步的先后顺序组装。'},
];
type Evidence = {text: string; evidence: string; step: number};
export type Pitfalls = {
  difficulty: Recipe['difficulty'];
  hardPoints: Evidence[];
  minorIssues: Evidence[];
  improvements: Evidence[];
  suitableFor: string[];
  techniques: string[];
  source: string;
};
type Match = {lesson: Lesson; evidence: string; step: number};
function actionMatches(recipe: Recipe): Match[] {
  const matches: Match[] = [];
  for (const lesson of lessons) {
    for (let index = 0; index < recipe.steps.length; index++) {
      const sentence = recipe.steps[index].split(/[。；;]/u).find(text=>lesson.cue.test(text));
      if (sentence) {
        matches.push({lesson, evidence:sentence.trim(), step:index+1});
        break;
      }
    }
  }
  if (!matches.length && recipe.steps.length) {
    matches.push({
      lesson:{name:'步骤衔接',cue:/备好|准备|分次|再|先|接着|按照/,observation:'步骤次序打乱后，等待中的食材状态可能发生变化。',adjustment:'备齐下一步需要的用料与工具，完成本步再继续。'},
      evidence:recipe.steps[0],step:1
    });
  }
  return matches;
}
export function pitfallsFor(recipe: Recipe): Pitfalls {
  const found=actionMatches(recipe);
  const selected: Match[]=[];
  for (const hit of found) {
    if (selected.length===2) break;
    if (!selected.some(s=>s.step===hit.step)) selected.push(hit);
  }
  const evidence=(hit:Match,text:string):Evidence=>({text,evidence:hit.evidence,step:hit.step});
  const methods=selected.map(hit=>hit.lesson.name);
  return {
    difficulty:recipe.difficulty,
    hardPoints:selected.map(hit=>evidence(hit,hit.lesson.name+' · '+hit.evidence)),
    minorIssues:selected.map(hit=>evidence(hit,hit.lesson.observation)),
    improvements:selected.map(hit=>evidence(hit,hit.lesson.adjustment)),
    suitableFor:[recipe.difficulty==='进阶'?'适合愿意分段练习的做饭者':'适合初学者按步骤跟做',...methods.map(name=>'想练习'+name+'的人')],
    techniques:methods,
    source:'依据《'+recipe.title+'》的制作步骤整理。'
  };
}

export type CookInput = {recipe: Recipe; method: string; outcome: string; failed: boolean; minutes: number; independent?:boolean};
type Earned = {recipeId:string; techniques:string[]; advanced:boolean; reflection:boolean};
export type CookProgress = {version:1; completed:Earned[]};
export type Dimension = {name:string; points:number; max:number; reason:string};
export const cookLevels = [
  {name:'厨房小白',dishes:0,techniques:0,advanced:0,reflections:0},
  {name:'新手学徒',dishes:2,techniques:2,advanced:0,reflections:0},
  {name:'家常菜能手',dishes:5,techniques:3,advanced:1,reflections:0},
  {name:'创意主厨',dishes:10,techniques:6,advanced:3,reflections:2},
  {name:'美食大神',dishes:18,techniques:9,advanced:5,reflections:4}
] as const;
export type CookReport = {
  score:number;level:number;levelName:string;dimensions:Dimension[];advice:string[];
  progress:CookProgress;credited:boolean;nextLevel:string;basis:string;
};
type Action = [RegExp, string];
const actions:Action[] = [
  [/洗|冲净|清洗/,'清洗'],[/切|削皮|改刀|剁|去皮/,'切配'],[/沥干|挤干|擦干|吸干/,'控水'],
  [/打散|搅散|打匀/,'打散'],[/煎|烙/,'煎制'],[/煮|沸|烧开|滚开/,'煮制'],[/翻炒|炒|煸|爆香/,'炒制'],
  [/蒸|上屉/,'蒸制'],[/炖|煨|煲|焖/,'焖炖'],[/烤|烘|预热/,'烘烤'],[/翻面|翻转/,'翻面'],
  [/收汁|收浓|勾芡|挂汁/,'收汁'],[/醒发|发酵|醒面|松弛/,'发酵醒面'],[/揉|擀|压成|团成/,'面团成形'],
  [/包入|包紧|包住|收口|捏紧/,'包馅'],[/过滤|过筛|滤出|滤掉/,'过滤'],[/拌|搅|调散/,'拌匀'],
  [/入冰箱|冷藏|放凉|冷却/,'冷却'],[/泡|泡发|浸|回软/,'浸泡'],[/淋|浇|冲入/,'淋入'],
  [/小火|大火|中火|中小火|转火|调低火/,'火力'],[/测温|温度计|中心.{0,5}\d+\s*[°℃度]/,'测温'],
  [/打发|翻拌/,'打发翻拌'],[/撒|铺|叠|分杯|卷紧/,'装配'],[/擦丝|撕|压泥|捣|搅打|打碎/,'改变质地']
];
const sensory = [
  {name:'质地',cue:/嫩|酥|脆|韧|糯|粉|绵|软|硬|柴|散|滑|弹|浓稠|黏|粘|顺滑|细腻|夹生/},
  {name:'外观',cue:/金黄|焦黄|褐色|乳白|红亮|透亮|透明|白色|红色|碧绿|焦斑|焦黑|凝固|定型|散开|清澈|浓稠|油亮|挂汁|出水|起泡|分层/},
  {name:'滋味与香气',cue:/太咸|太淡|偏咸|偏淡|咸淡|入味|鲜|甜|酸|苦|辣|香味|葱香|蒜香|奶香|焦香|没味|腥/},
  {name:'熟度',cue:/熟透|全熟|断生|熟了|无硬芯|夹生|中心.{0,6}(?:℃|度)|中心凝固|能.*穿透|不透明/},
];
function tokens(text:string) {
  return new Set((text.match(/[\u3400-\u9fff]{2,}/g)??[]).flatMap(part=>Array.from({length:part.length-1},(_,i)=>part.slice(i,i+2))));
}
function ingredientsMentioned(recipe:Recipe,method:string) {
  const mt=tokens(method);
  const generic=/^(食用|饮用|少量|适量|去皮|去壳|无盐|干燥|去骨|熟食|原味|原料|植物|普通|纯净|无糖)$/;
  return recipe.ingredients.filter(i=>{
    const name=i.name.replace(/[（(].*?[）)]/g,'').trim();
    if (/^(水|开水|温水|清水|盐|食盐|糖|白糖|油|食用油|植物油)$/.test(name)) return false;
    if (method.includes(name)) return true;
    return Array.from(tokens(name)).some(s=>!generic.test(s)&&mt.has(s));
  }).length;
}
function repertoire(previous: CookProgress|undefined): Earned[] {
  if (previous?.version!==1 || !Array.isArray(previous.completed)) return [];
  const unique=new Map<string,Earned>();
  for (const item of previous.completed) {
    if (!item || typeof item.recipeId!=='string' || !item.recipeId || !Array.isArray(item.techniques)) continue;
    if (unique.has(item.recipeId)) continue;
    const techniques=[...new Set(item.techniques.filter(t=>t==='步骤衔接'||lessons.some(l=>l.name===t)))];
    unique.set(item.recipeId,{recipeId:item.recipeId,techniques,advanced:item.advanced===true,reflection:item.reflection===true});
  }
  return Array.from(unique.values());
}
export function cookStanding(progress?:CookProgress) {
  const completed=repertoire(progress);
  const repertoireSkills=new Set(completed.flatMap(r=>r.techniques));
  const advanced=completed.filter(c=>c.advanced).length, reflections=completed.filter(c=>c.reflection).length;
  let level=1;
  for (let i=1;i<cookLevels.length;i++) {
    const rule=cookLevels[i];
    if (completed.length>=rule.dishes && repertoireSkills.size>=rule.techniques && advanced>=rule.advanced && reflections>=rule.reflections) level=i+1;
    else break;
  }
  return {level,advanced,reflections,repertoireSkills,completed:completed.length};
}
export function nextChallenge(pool:Recipe[],progress:CookProgress,currentId:string) {
  const done=new Set(progress.completed.map(r=>r.recipeId));
  const {level}=cookStanding(progress);
  const candidates=pool.filter(r=>r.id!==currentId&&!done.has(r.id));
  const difficulty=level<3?'简单':'进阶';
  const targetMinutes=[15,30,40,65,90][level-1];
  return candidates.filter(r=>r.difficulty===difficulty).sort((a,b)=>Math.abs(a.time-targetMinutes)-Math.abs(b.time-targetMinutes))[0]||candidates[0];
}
export function assessCook(input:CookInput,previous?:CookProgress):CookReport {
  const {recipe}=input;
  const method=(input.method??'').trim().slice(0,3000);
  const outcome=(input.outcome??'').trim().slice(0,3000);
  const minutes=Number.isFinite(input.minutes)&&input.minutes>0&&input.minutes<=60*24*7?input.minutes:0;
  const steps=recipe.steps.join('。');
  const used=actions.filter(([rule])=>rule.test(method)&&rule.test(steps)).map(([,name])=>name);
  const ingredients=ingredientsMentioned(recipe,method);
  const methods=actionMatches(recipe).filter(x=>x.lesson.cue.test(method)).map(hit=>hit.lesson.name);
  const observations=sensory.filter(s=>s.cue.test(outcome)).map(o=>o.name);
  const procedural=used.length>=2 && ingredients>0;
  // 自述中的否定句不作夹生报告。用单独的下一次行动表达识别复盘。
  const unsafeWords=outcome.replace(/(?:没有|并未|并不|不再|无|不|未)(?:夹生|生心|生肉|不熟|没熟)/g,'');
  const underdone=/夹生|没熟|未熟|没有熟|不熟|半生|生心|里面.{0,2}生的|中间.{0,2}生的/.test(unsafeWords);
  const reflection=/(?:下次|下回|下锅前要|下次要|准备改|后来改|改成|改用|调低|调高|多焖|少放|提前|延长|缩短).{0,30}(?:火|秒|分钟|克|时间|量|盐|油|水|糖|切|翻|下锅|搅|温|收|盖|沥|加|放|蒸|煮|煎|烤)/.test(method+'。'+outcome);
  const methodPoints=Math.min(35,used.length*6+Math.min(2,ingredients)*6+(methods.length?5:0));
  const outcomePoints=Math.min(30,observations.length*10);
  const controlPoints=(methods.length?10:0)+(reflection?10:0);
  const logPoints=(minutes?8:0)+(typeof input.failed==='boolean'&&(method.length>0||outcome.length>0)?7:0);
  const raw=methodPoints+outcomePoints+controlPoints+logPoints;
  const failed=input.failed===true||underdone;
  const score=failed?Math.min(59,raw):raw;
  const qualifies=input.independent!==false&&!failed&&score>=65&&procedural&&observations.length>=1&&methods.length>0&&minutes>0;
  const completed=repertoire(previous);
  const existing=completed.find(e=>e.recipeId===recipe.id);
  const credited=qualifies&&!existing;
  if (credited) completed.push({recipeId:recipe.id,techniques:[...new Set(methods)].slice(0,2),advanced:recipe.difficulty==='进阶',reflection});
  const progress:CookProgress={version:1,completed};
  const {level,advanced,reflections,repertoireSkills}=cookStanding(progress);
  const target=cookLevels[level];
  const gaps=target?[
    [target.dishes-completed.length,'道不同菜'],[target.techniques-repertoireSkills.size,'种不同技法'],
    [target.advanced-advanced,'道进阶菜'],[target.reflections-reflections,'道写有具体调整的菜']
  ] as const:[];
  const nextLevel=target?'升至'+target.name+'还需'+gaps.filter(([n])=>Number(n)>0).map(([n,label])=>n+String(label)).join('、')+'。':'本阶段目标已达成，可继续练习新菜和薄弱技法。';
  const dimensions:Dimension[]=[
    {name:'做法记录',points:methodPoints,max:35,reason:used.length?'记录了菜谱中的'+used.join('、')+'，能对应'+ingredients+'种食材。':'写下处理过的食材和实际操作。'},
    {name:'成品观察',points:outcomePoints,max:30,reason:observations.length?'描述涉及'+observations.join('、')+'。':'请补一条看见、尝到或测出的具体变化。'},
    {name:'火候与复盘',points:controlPoints,max:20,reason:(methods.length?'记录中可对应'+methods.slice(0,2).join('、')+'。':'还缺具体技法的记录。')+(reflection?'已写出下一次或当场的操作调整。':'可补一句怎样调整。')},
    {name:'过程记录',points:logPoints,max:15,reason:minutes?'自报'+minutes+'分钟，菜谱参考'+recipe.time+'分钟；此项按完整记录给分。':'还没有有效的实际耗时。'}
  ];
  const advice:string[]=[];
  if (underdone) advice.push('先对照原菜谱的熟度要求复查成品，记录这次停火时观察到的状态。');
  if(input.independent===false) advice.push('今天和搭档一起练成了。下次试着独立做一次，再来点亮这道菜。');
  if (failed) advice.push('这次作为练习复盘，先选一个环节重做。');
  if (!procedural) advice.push('补写一道实际操作，包括处理了哪种食材、按什么顺序下锅。');
  if (!observations.length) advice.push('记下成品的颜色、口感或熟度，例如最厚的一块切开后是什么样。');
  if (!minutes) advice.push('记录从开始备料到出锅的实际分钟数。');
  if (!reflection) advice.push('留一条具体调整，例如下次在哪一步提前调小火，或把切块改多厚。');
  if (qualifies && existing) advice.unshift('这道菜已计入能力记录。再选一道新菜，把同一项技法迁移过去。');
  if (!advice.length) advice.push(credited?'本次新菜与技法已计入，下一次试一款不同做法。':'继续围绕原菜谱的状态判断练习。');
  return {score,level,levelName:cookLevels[level-1].name,dimensions,advice,progress,credited,nextLevel,
    basis:'按自述与菜谱步骤匹配的练习评分。实际口感、火候和熟度需要你自行核实。'+(failed?' 本次自报翻车或描述含夹生信号，练习总分上限为59分。':'')};
}
