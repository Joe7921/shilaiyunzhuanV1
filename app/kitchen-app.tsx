'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Search, Camera, ChefHat, BookOpen, Heart, Users, SlidersHorizontal, Clock3, Utensils, Dices, Flower2, Check, CircleHelp, LogIn, NotebookPen, X } from 'lucide-react';
import { recipes, personalities, type Recipe } from '@/lib/recipes';
import { api, dayKey, matchesPrefs, defaultPrefs, type Preferences, type User } from '@/lib/client';
import { Tomato, Modal, RecipeCard, Empty } from '@/components/ui';
import RecipeDetail from '@/components/recipe-detail';
import {CookBadge} from '@/components/planner/cook-badge';
import PlannerDesk from '@/components/planner';
import { Feed, RecordForm } from '@/components/social';
import { FortuneTool, WheelTool, PersonalityTool, PollTool } from '@/components/selection-tools';

import {Home,Catalogue,FoodCalendar,type Page} from '@/components/kitchen-sections';
import MagicRoom,{emptyNotebook,type Notebook} from '@/components/magic-room';
import {zodiac,type Birth} from '@/lib/astro';
const navigation=[{id:'home',label:'今日灵感'},{id:'magic',label:'星座魔法屋'},{id:'recipes',label:'环球菜谱'},{id:'season',label:'食养馆'},{id:'calendar',label:'节日食历'},{id:'planner',label:'计划室'},{id:'community',label:'小饭圈'}] as const;
const pageIds=new Set<string>([...navigation.map(n=>n.id),'book']);
type Dialog = 'fortune' | 'wheel' | 'personality' | 'poll' | 'preferences' | 'record' | 'login' | 'recipe' | null;

const allergens = Array.from(new Set(['蛋','奶','小麦','大豆','花生','坚果','鱼','虾','甲壳类','贝类','芝麻',...recipes.flatMap(r=>r.allergens)]));

export default function KitchenApp() {
  const [page, setPage] = useState<Page>('home');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recordRecipe, setRecordRecipe] = useState<Recipe | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [personality, setPersonality] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [birth,setBirth]=useState<Birth>({date:'',time:''});
  const [notebook,setNotebook]=useState<Notebook>(emptyNotebook);
  const [loadedNotebook,setLoadedNotebook]=useState('');

  const [bookTab, setBookTab] = useState<'favorites'|'diary'|'menu'>('favorites');
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialPoll, setInitialPoll] = useState<string | undefined>();
  const [visitorId, setVisitorId] = useState('little-tomato');
  const [today, setToday] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState('');
  const favoriteSaving = useRef(false);

  useEffect(() => {
    setToday(dayKey());
    try {
      const localPrefs = JSON.parse(localStorage.getItem('sl-prefs') || 'null');
      if (localPrefs && Array.isArray(localPrefs.excluded)) setPrefs({ excluded: localPrefs.excluded.filter((a: string) => allergens.includes(a)), maxTime: [0,15,20,30].includes(localPrefs.maxTime) ? localPrefs.maxTime : 0, vegetarian: Boolean(localPrefs.vegetarian), avoid: Array.isArray(localPrefs.avoid)?localPrefs.avoid:[],tastes: Array.isArray(localPrefs.tastes)?localPrefs.tastes:[] });
      const localFavorites = JSON.parse(localStorage.getItem('sl-favorites') || '[]');
      if (Array.isArray(localFavorites)) setFavorites(localFavorites.filter(id => recipes.some(r => r.id === id)));
      setPersonality(localStorage.getItem('sl-personality'));
      let id = localStorage.getItem('sl-visitor');
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('sl-visitor', id); }
      setVisitorId(id);
    } catch { /* Device storage is optional; the app remains usable. */ }
    const search = new URLSearchParams(window.location.search);
    if (search.get('poll')) { setInitialPoll(search.get('poll')!); setDialog('poll'); }
    else if (search.get('recipe')) { const recipe = recipes.find(r => r.id === search.get('recipe')); if (recipe) { setSelectedRecipe(recipe); setDialog('recipe'); } }
    api<{user: User | null; aiAvailable: boolean}>('?resource=me').then(async data => {
      setUser(data.user);
      if (data.user) {
        try {
          const profile = await api<{favorites: string[]; personality: string | null}>('?resource=profile');
          setFavorites(profile.favorites); setPersonality(profile.personality); setProfileReady(true);
        } catch(e) { setProfileError((e as Error).message || '饭本暂时没能加载，请重试。'); }
      } else {
        setProfileReady(true);
      }
    }).catch(() => { /* Browsing and device-local favorites work without a session. */ }).finally(() => setProfileLoading(false));
  }, []);

  const notebookKey='sl-v2-notebook-'+(user?.id||'device');
  useEffect(()=>{
    if(profileLoading)return;
    let n=emptyNotebook;
    try{
      const raw=JSON.parse(localStorage.getItem(notebookKey)||'null');
      if(raw&&Array.isArray(raw.history)&&raw.menus&&typeof raw.menus==='object')n={birth:raw.birth&&zodiac(raw.birth.date)?raw.birth:null,menus:raw.menus,history:raw.history};
    }catch{}
    setNotebook(n);setBirth(n.birth||{date:'',time:''});setLoadedNotebook(notebookKey);
  },[notebookKey,profileLoading]);
  function saveNotebook(n:Notebook){
    setNotebook(n);
    try{localStorage.setItem(notebookKey,JSON.stringify(n))}catch{setToast('当前浏览器无法保存，下次打开后需重新填写')}
  }
  useEffect(()=>{
    const refresh=()=>setToday(dayKey());
    const readRoute=()=>{const id=location.hash.slice(1).split('/')[0];setPage(pageIds.has(id)?id as Page:'home');setDialog(null)};
    if(location.hash)readRoute();
    const timer=setInterval(refresh,10000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);window.addEventListener('hashchange',readRoute);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('hashchange',readRoute)};
  },[]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const candidates = useMemo(() => recipes.filter(r => matchesPrefs(r, prefs)), [prefs]);
  const currentPersonality = personalities.find(p => p.id === personality);
  const hasPrefs = prefs.excluded.length > 0 || prefs.maxTime > 0 || prefs.vegetarian;

  function goTo(next: Page) { setPage(next); setDialog(null); window.location.hash=next; window.scrollTo({top:0, behavior:'instant'}); }
  function openRecipe(recipe: Recipe) { setSelectedRecipe(recipe); setDialog('recipe'); }
  function closeDialog() {
    setDialog(null); setInitialPoll(undefined);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname+window.location.hash);
  }
  function record(recipe?: Recipe) { setRecordRecipe(recipe || null); setDialog('record'); }
  async function retryProfile() {
    setProfileLoading(true); setProfileError('');
    try {
      const profile = await api<{favorites: string[]; personality: string | null}>('?resource=profile');
      setFavorites(profile.favorites); setPersonality(profile.personality); setProfileReady(true);
    } catch(e) { setProfileError((e as Error).message); }
    finally { setProfileLoading(false); }
  }
  async function toggleFavorite(id: string) {
    if (profileLoading) { setToast('正在打开饭本，马上就好'); return; }
    if (user && !profileReady) { setToast('请先重新加载账号饭本，再保存收藏'); return; }
    if (favoriteSaving.current) { setToast('上一份收藏正在保存，稍等一下'); return; }
    favoriteSaving.current = true;
    const previous = favorites;
    const next = favorites.includes(id) ? favorites.filter(r => r !== id) : [...favorites, id];
    setFavorites(next);
    try {
      if (user) { const saved = await api<{favorites:string[]}>('', { action:'save-profile', favorites:next }); setFavorites(saved.favorites); }
      else localStorage.setItem('sl-favorites', JSON.stringify(next));
      setToast(next.includes(id) ? (user ? '这份美味，已经收进饭本啦' : '已收藏在当前设备') : '已从收藏夹移除');
    } catch(e) { setFavorites(previous); setToast((e as Error).message || '收藏没保存成功，请重试。'); }
    finally { favoriteSaving.current = false; }
  }
  async function savePersonality(id: string) {
    setPersonality(id);
    try {
      if (user) await api('', { action:'save-profile', personality:id });
      else localStorage.setItem('sl-personality', id);
    } catch { setToast('结果已生成，保存暂未成功。'); }
  }
  function savePrefs(next: Preferences) {
    setPrefs(next);
    try { localStorage.setItem('sl-prefs', JSON.stringify(next)); } catch { setToast('偏好已应用，当前设备无法持久保存。'); }
  }
  const renderCard = (recipe: Recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onFavorite={() => toggleFavorite(recipe.id)} onOpen={() => openRecipe(recipe)}/>;

  return <div className="app-shell">
    <header className="site-header"><div className="header-inner"><button className="brand" onClick={()=>goTo('home')} aria-label="食来运转首页"><img src="/images/brand/picnic-mark.webp" alt="" width="51" height="51"/><span>食来运转</span></button>
      <nav className="desktop-nav" aria-label="主导航">{navigation.map(n=><button key={n.id} className={page===n.id?'active':''} onClick={()=>goTo(n.id)} aria-current={page===n.id?'page':undefined}>{n.label}</button>)}</nav>
      <div className="header-actions"><button className="icon-button" onClick={()=>setDialog('preferences')} aria-label="饮食偏好"><SlidersHorizontal size={19}/></button><button className="header-record" onClick={()=>goTo('book')}><BookOpen size={18}/> 我的饭本</button></div></div></header>
    <main>
      {profileError && <div className="profile-load-error" role="alert"><span>账号饭本暂未加载：{profileError}</span><button className="text-button" onClick={retryProfile} disabled={profileLoading}>重新加载</button></div>}
      {page==='home'&&<Home pool={candidates} renderCard={renderCard} day={today} birthday={birth.date} go={goTo} tool={setDialog} onOpen={openRecipe} onPhoto={()=>record()}/>}
      {page==='planner'&&<PlannerDesk key={profileLoading?'loading':user?.id||'guest'} day={today||dayKey()} prefs={prefs} user={user} profileLoading={profileLoading} open={openRecipe} onPrefs={()=>setDialog('preferences')}/>}
      {page==='magic'&&<MagicRoom day={today} birth={birth} onBirth={setBirth} notebook={notebook} onSave={saveNotebook} candidates={candidates} tastes={prefs.tastes||[]} onOpen={openRecipe} onPrefs={()=>setDialog('preferences')} onToast={setToast} ready={loadedNotebook===notebookKey}/>}
      {(page==='season'||page==='recipes')&&<Catalogue key={page} seasonal={page==='season'} pool={candidates} renderCard={renderCard} onPrefs={()=>setDialog('preferences')}/>}
      {page==='calendar'&&<FoodCalendar day={today} birthday={birth.date} pool={candidates} renderCard={renderCard}/>}
      {page === 'community' && <div className="page-content inner-page"><div className="page-title"><div><span className="page-kicker"><Users size={18}/>有人认真吃饭，就有人认真生活</span><h1>好友饭圈</h1><p>一人食，也有人一起分享好滋味。</p></div><button className="primary-button" onClick={() => record()}><Camera size={18}/>晒晒我的一餐</button></div><div className="community-note"><Heart size={18}/><span>这里收藏真实的一餐一饭。你的日记只有选择“发布到小饭圈”才会出现在这里。</span></div><Feed scope="community" user={user} refreshKey={refreshKey} onRecord={() => record()} onLogin={() => setDialog('login')} onOpen={openRecipe}/></div>}

      {page === 'book' && <div className="page-content inner-page"><div className="profile-hero"><div className="profile-illustration"><Tomato size={86}/></div><div><span className="page-kicker">给每一顿认真吃的饭，留个位置</span><h1>{user ? user.name + '的饭本' : '我的饭本'}</h1><p>{currentPersonality ? currentPersonality.title + ' · ' + currentPersonality.description : '你的收藏、你的日常，都在这一页。'}</p><div className="profile-links"><button className="text-button" onClick={() => setDialog('personality')}><Flower2 size={17}/>{currentPersonality ? '重新测测美食人格' : '发现我的美食人格'}</button><button className="text-button" onClick={() => setDialog('preferences')}><SlidersHorizontal size={16}/>选菜偏好</button></div></div><button className="primary-button" onClick={() => record()}><Camera size={18}/>记录一餐</button></div><CookBadge key={user?.id||'guest'} userId={user?.id||null} loading={profileLoading}/><div className="book-tabs"><button className={bookTab==='menu'?'active':''} onClick={()=>setBookTab('menu')}><Utensils size={16}/>今日菜单</button><button className={bookTab === 'favorites' ? 'active' : ''} onClick={() => setBookTab('favorites')}><Heart size={18}/>心头好收藏 <span>{favorites.length}</span></button><button className={bookTab === 'diary' ? 'active' : ''} onClick={() => setBookTab('diary')}><NotebookPen size={18}/>饭饭日记</button></div>{bookTab==='menu'?<section className="menu-list">{notebook.menus[today]?.length?recipes.filter(r=>notebook.menus[today].includes(r.id)).map(r=><div key={r.id}>{renderCard(r)}<button className="flat-button" onClick={()=>saveNotebook({...notebook,menus:{...notebook.menus,[today]:notebook.menus[today].filter(id=>id!==r.id)}})}>移出今日菜单</button></div>):<Empty title="今天的菜单还空着" text="抽到想吃的幸运菜后，把它加入今天的菜单。"><button className="magic-button" onClick={()=>goTo('magic')}>去星座魔法屋</button></Empty>}</section>:bookTab === 'favorites' ? <>{!user && favorites.length > 0 && <p className="storage-note">这些收藏保存在当前设备。登录后可使用账号饭本。</p>}{favorites.length ? <div className="recipe-grid">{recipes.filter(r => favorites.includes(r.id)).map(renderCard)}</div> : <Empty icon={<Heart size={42}/>} title="心头好，慢慢攒" text="遇到想做的菜，点一下小爱心，下次就能在这里找到。"><button className="primary-button" onClick={() => goTo('recipes')}>去看看今天的菜谱</button></Empty>}</> : <Feed scope="mine" user={user} refreshKey={refreshKey} onRecord={() => record()} onLogin={() => setDialog('login')} onOpen={openRecipe}/>}</div>}
    </main>

    <footer className="site-footer"><div className="footer-brand"><Tomato size={30}/><strong>食来运转</strong><span>认真吃饭，快乐加餐。</span></div><p>美食占卜与人格测试仅供趣味娱乐。热量为估算值。</p><button className="text-button" onClick={() => setDialog('preferences')}>你的口味，你来决定 <Heart size={14}/></button></footer>
    <nav className="mobile-nav" aria-label="手机导航">{([{id:'home',label:'今日灵感',icon:Sparkles},{id:'magic',label:'占卜',icon:Sparkles},{id:'recipes',label:'菜谱',icon:ChefHat},{id:'planner',label:'计划室',icon:NotebookPen},{id:'community',label:'小饭圈',icon:Users},{id:'book',label:'我的饭本',icon:BookOpen}] as const).map(({id,label,icon:Icon}) => <button key={id} className={page === id ? 'active' : ''} onClick={() => goTo(id)} aria-current={page === id ? 'page' : undefined}><Icon size={22}/><span>{label}</span></button>)}</nav>

    {dialog === 'fortune' && <Modal title="今天的美味，藏在哪张牌里？" subtitle="凭第一感觉选一张，拆开你的今日幸运菜。" onClose={closeDialog}><FortuneTool candidates={candidates} seed={(today || dayKey()) + ':' + (user?.id || visitorId)} onOpen={openRecipe} onPrefs={() => setDialog('preferences')}/></Modal>}
    {dialog === 'wheel' && <Modal title="今天吃什么大转盘" subtitle="选择困难到此结束。转一圈，认真吃一餐。" onClose={closeDialog}><WheelTool candidates={candidates} onOpen={openRecipe} onPrefs={() => setDialog('preferences')}/></Modal>}
    {dialog === 'personality' && <Modal title="每一口，都是你的美食人格" subtitle="没有标准答案，选最像你的那一个。" onClose={closeDialog}><PersonalityTool onResult={savePersonality} onOpen={openRecipe} allowedRecipeIds={candidates.map(r => r.id)}/></Modal>}
    {dialog === 'poll' && <Modal title="让饭搭子来决定" subtitle="自己纠结的事，让朋友一起选。" onClose={closeDialog}><PollTool user={user} candidates={candidates} initialId={initialPoll} onLogin={() => setDialog('login')} onOpen={openRecipe} onToast={setToast}/></Modal>}
    {dialog === 'preferences' && <Modal title="好吃，也要合你的口味" subtitle="这些偏好会用于幸运抽签、转盘和菜谱筛选，保存在当前设备。" onClose={closeDialog}><PreferencesForm value={prefs} onChange={savePrefs} onDone={() => { closeDialog(); setToast('记住啦！接下来按你的口味选菜'); }} count={candidates.length}/></Modal>}
    {dialog === 'recipe' && selectedRecipe && <Modal title={selectedRecipe.title} onClose={closeDialog} wide><RecipeDetail key={selectedRecipe.id} recipe={selectedRecipe} restricted={!!(prefs.vegetarian||prefs.excluded.length||prefs.avoid?.length||page==='planner')} favorite={favorites.includes(selectedRecipe.id)} onFavorite={() => toggleFavorite(selectedRecipe.id)} onRecord={() => record(selectedRecipe)} onAlternative={id=>{const r=recipes.find(r=>r.id===id);if(r)openRecipe(r)}}/></Modal>}
    {dialog === 'record' && <Modal title="记下这一餐的小幸福" subtitle="照片、心情，还有认真吃饭的你。" onClose={closeDialog}><RecordForm user={user} initialRecipe={recordRecipe} onLogin={() => setDialog('login')} onSaved={() => {closeDialog();setRefreshKey(k => k+1);setPage('book');setBookTab('diary');setToast('这一餐，已经好好收进饭本啦');}}/></Modal>}
    {dialog === 'login' && <Modal title="给你的饭本，留一个专属位置" onClose={closeDialog}><Empty icon={<Tomato size={76}/>} title="登录后，把美味好好收藏" text="保存照片日记、发起朋友投票，都需要先登录。"><a className="primary-button" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search)} target="_top"><LogIn size={18}/>使用 ChatGPT 登录</a></Empty></Modal>}
    {toast && <div className="toast" role="status"><Check size={18}/>{toast}</div>}
  </div>;
}

function PreferencesForm({ value, onChange, onDone, count }: { value: Preferences; onChange: (p: Preferences) => void; onDone: () => void; count: number }) {
  const [draft,setDraft]=useState((value.avoid||[]).join('，'));
  return <div className="preferences-form"><h3>这些食材，先不选</h3><p className="muted">选择需要避开的食材类别。包装食品的配料也请自行核对。</p><div className="allergen-options">{allergens.map(item => <button key={item} className={value.excluded.includes(item) ? 'selected' : ''} aria-pressed={value.excluded.includes(item)} onClick={() => onChange({...value,excluded:value.excluded.includes(item)?value.excluded.filter(x=>x!==item):[...value.excluded,item]})}>{item}{value.excluded.includes(item)&&<Check size={15}/>}</button>)}</div><label className="pref-input">其他忌口食材<input className="field" value={draft} placeholder="例如：香菜，牛肉" onChange={e=>{setDraft(e.target.value);onChange({...value,avoid:e.target.value.split(/[，、,]/).map(x=>x.trim()).filter(Boolean)})}}/></label><h3>偏爱的口味</h3><div className="allergen-options">{['清淡','酸甜','咸鲜','麻辣','奶香','蒜香','甜'].map(t=><button key={t} className={value.tastes?.includes(t)?'selected':''} aria-pressed={!!value.tastes?.includes(t)} onClick={()=>onChange({...value,tastes:value.tastes?.includes(t)?value.tastes.filter(a=>a!==t):[...(value.tastes||[]),t]})}>{t}</button>)}</div><h3>今天有多少时间做饭？</h3><div className="time-options">{[{value:0,label:'慢慢来，不限时'},{value:15,label:'15 分钟内'},{value:20,label:'20 分钟内'},{value:30,label:'30 分钟内'}].map(item => <button key={item.value} className={value.maxTime===item.value?'selected':''} onClick={()=>onChange({...value,maxTime:item.value})} aria-pressed={value.maxTime===item.value}><Clock3 size={16}/>{item.label}</button>)}</div><label className="vegetarian-option"><input type="checkbox" checked={value.vegetarian} onChange={e=>onChange({...value,vegetarian:e.target.checked})}/><span><strong>这次想吃素</strong><small>不含肉、鱼虾，保留蛋和奶。</small></span><span className="toggle-visual" aria-hidden="true"/></label><p className="preference-result">现在有 <strong>{count}</strong> 道菜符合你的偏好。{count === 0 ? '可以放宽时间限制，或调整食材选择。' : '一会儿见，好味道！'}</p><div className="button-row"><button className="text-button" onClick={()=>{setDraft('');onChange(defaultPrefs)}}>重置偏好</button><button className="primary-button" onClick={onDone}><Check size={17}/>就按这个选</button></div></div>;
}
