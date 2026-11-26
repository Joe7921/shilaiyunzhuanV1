'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Search, Camera, ChefHat, BookOpen, Heart, Users, SlidersHorizontal, Clock3, Utensils, Dices, Flower2, Check, CircleHelp, LogIn, NotebookPen, X } from 'lucide-react';
import { recipes, personalities, type Recipe } from '@/lib/recipes';
import { api, dayKey, matchesPrefs, defaultPrefs, type Preferences, type User } from '@/lib/client';
import { Tomato, Modal, RecipeCard, Empty } from '@/components/ui';
import RecipeDetail from '@/components/recipe-detail';
import { Feed, RecordForm } from '@/components/social';
import { FortuneTool, WheelTool, PersonalityTool, PollTool } from '@/components/selection-tools';

type Page = 'home' | 'recipes' | 'community' | 'book';
type Dialog = 'fortune' | 'wheel' | 'personality' | 'poll' | 'preferences' | 'record' | 'login' | 'recipe' | null;
const categories = ['全部', '快手菜', '下饭菜', '轻负担', '一人食', '暖心汤'];
const allergens = ['蛋', '奶', '小麦', '大豆', '花生', '鱼', '虾'];

export default function KitchenApp() {
  const [page, setPage] = useState<Page>('home');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recordRecipe, setRecordRecipe] = useState<Recipe | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [personality, setPersonality] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [bookTab, setBookTab] = useState<'favorites'|'diary'>('favorites');
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
      if (localPrefs && Array.isArray(localPrefs.excluded)) setPrefs({ excluded: localPrefs.excluded.filter((a: string) => allergens.includes(a)), maxTime: [0,15,20,30].includes(localPrefs.maxTime) ? localPrefs.maxTime : 0, vegetarian: Boolean(localPrefs.vegetarian) });
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
      setUser(data.user); setAiAvailable(Boolean(data.aiAvailable));
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const candidates = useMemo(() => recipes.filter(r => matchesPrefs(r, prefs)), [prefs]);
  const filteredRecipes = useMemo(() => candidates.filter(r => (category === '全部' || r.tags.includes(category)) && (!query.trim() || (r.title + r.tags.join('') + r.ingredients.map(i => i.name).join('')).includes(query.trim()))), [candidates, category, query]);
  const currentPersonality = personalities.find(p => p.id === personality);
  const hasPrefs = prefs.excluded.length > 0 || prefs.maxTime > 0 || prefs.vegetarian;

  function goTo(next: Page) { setPage(next); setQuery(''); setCategory('全部'); window.scrollTo({top:0, behavior:'instant'}); }
  function openRecipe(recipe: Recipe) { setSelectedRecipe(recipe); setDialog('recipe'); }
  function closeDialog() {
    setDialog(null); setInitialPoll(undefined);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
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
    <header className="site-header"><div className="header-inner"><button className="brand" onClick={() => goTo('home')} aria-label="食来运转首页"><Tomato size={45}/><span>食来运转<small>把日子吃成喜欢的样子</small></span></button><nav className="desktop-nav" aria-label="主导航">{([{id:'home',label:'今日灵感'},{id:'recipes',label:'菜谱小厨房'},{id:'community',label:'好友饭圈'},{id:'book',label:'我的饭本'}] as const).map(item => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => goTo(item.id)} aria-current={page === item.id ? 'page' : undefined}>{item.label}</button>)}</nav><div className="header-actions"><button className="icon-button header-search" aria-label="搜索菜谱" onClick={() => { goTo('recipes'); setTimeout(() => document.getElementById('recipe-search')?.focus(), 50); }}><Search size={21}/></button><button className="header-record" aria-label="记录一餐" onClick={() => record()}><Camera size={18}/><span>记录一餐</span></button><button className="profile-button" onClick={() => goTo('book')} aria-label="我的饭本">{user?.name?.slice(0,1) || <ChefHat size={20}/>}</button></div></div></header>
    <main>
      {profileError && <div className="profile-load-error" role="alert"><span>账号饭本暂未加载：{profileError}</span><button className="text-button" onClick={retryProfile} disabled={profileLoading}>重新加载</button></div>}
      {page === 'home' && <>
        <section className="hero"><div className="hero-inner"><div className="hero-copy"><div className="hero-note"><span>✦</span> 好胃口，是一种好运气</div><h1>今天吃什么，<br/>交给一点小运气。</h1><p>让一份幸运菜谱，接住你的选择困难。<br className="desktop-break"/>从今天的心情出发，遇见刚刚好的美味。</p><div className="hero-buttons"><button className="primary-button hero-cta" onClick={() => setDialog('fortune')}><Sparkles size={21}/>抽一道幸运菜</button><button className="text-button" onClick={() => setDialog('personality')}>测测我的美食人格</button></div><div className="hero-footnote"><span className="mini-foods"><i>🍅</i><i>🍳</i><i>🍙</i></span><span>不用想太多，好好吃饭就好。</span></div></div><div className="hero-art"><span className="art-note">今日份的美味，正在发生</span><img src="/images/hero-food.png" alt="番茄、煎蛋和小饭团围着红锅，抽取今天的幸运食材" width={1448} height={1086} fetchPriority="high"/><span className="art-seal">好好吃饭<br/><span>好运 +1</span></span></div></div><div className="hero-scallop" aria-hidden="true"/></section>
        <div className="page-content home-content"><section className="play-section"><div className="section-heading"><div><h2>给今天，加点吃饭的乐趣<span className="hand-star">✧</span></h2><p>总有一种方式，找到你的心头好。</p></div><button className={'preference-button' + (hasPrefs ? ' has-prefs' : '')} onClick={() => setDialog('preferences')}><SlidersHorizontal size={16}/>{hasPrefs ? '已设置选菜偏好' : '我的选菜偏好'}</button></div><div className="play-grid">
          <button className="play-card play-wheel" onClick={() => setDialog('wheel')}><div><span className="small-label">选择困难，转走！</span><h3>今天吃什么大转盘</h3><p>转一转，把纠结交给命运。</p><span className="play-link">现在转一转 <Dices size={16}/></span></div><div className="mini-wheel" aria-hidden="true"><span>?</span><i/></div></button>
          <button className="play-card play-personality" onClick={() => setDialog('personality')}><div><span className="small-label">每一口，都是你的性格</span><h3>你的美食人格是？</h3><p>5 个小问题，遇见另一面自己。</p><span className="play-link">测测我的人格 <Flower2 size={16}/></span></div><div className="personality-art" aria-hidden="true"><span className="egg-shape"><i/><b>⌣</b></span><i className="little-flower">✿</i></div></button>
          <button className="play-card play-friends" onClick={() => { setInitialPoll(undefined); setDialog('poll'); }}><div><span className="small-label">朋友的选择，也很香</span><h3>让饭搭子来决定</h3><p>发起一场“今天吃什么”投票。</p><span className="play-link">邀请朋友帮选 <Users size={16}/></span></div><div className="friends-art" aria-hidden="true"><span>🍙</span><span>🍅</span><i>♡</i></div></button>
        </div></section>
        <section className="home-recipes"><div className="section-heading"><div><h2>今日开饭灵感 <span className="title-tomato"><Tomato size={28}/></span></h2><p>简单的食材，也能做出满满幸福感。</p></div><button className="text-button browse-all" onClick={() => goTo('recipes')}>去小厨房逛逛 <BookOpen size={17}/></button></div><div className="category-row" role="group" aria-label="菜谱分类">{categories.slice(0,5).map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)} aria-pressed={category === c}>{c === '全部' && <Utensils size={15}/>} {c === '全部' ? '为你推荐' : c}</button>)}</div>{filteredRecipes.length ? <div className="recipe-grid">{filteredRecipes.slice(0,4).map(renderCard)}</div> : <Empty title="这次还没找到合适的菜" text="试着放宽用时或调整分类，忌口会一直保留。"><button className="secondary-button" onClick={() => setDialog('preferences')}>调整选菜偏好</button></Empty>}</section>
        <section className="diary-banner"><div className="banner-icon"><NotebookPen size={34}/><span>✧</span></div><div><h2>把一餐一饭，过成小小的幸福。</h2><p>拍下今天的美味，留给未来的自己，也分享给饭搭子。</p></div><button className="secondary-button" onClick={() => record()}><Camera size={18}/>写下我的饭饭日记</button></section></div>
      </>}

      {page === 'recipes' && <div className="page-content inner-page"><div className="page-title"><div><span className="page-kicker"><ChefHat size={18}/>今天，也给自己做顿好吃的</span><h1>菜谱小厨房</h1><p>从一顿简单的饭开始，慢慢把生活煮热。</p></div><button className="secondary-button" onClick={() => setDialog('fortune')}><Sparkles size={18}/>不知道做什么？抽一道</button></div><div className="recipe-toolbar"><label className="search-field"><Search size={20}/><input id="recipe-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="想吃什么？搜菜名或手边的食材" aria-label="搜索菜名或食材"/>{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={17}/></button>}</label><button className={'preference-button' + (hasPrefs ? ' has-prefs' : '')} onClick={() => setDialog('preferences')}><SlidersHorizontal size={17}/>选菜偏好</button></div><div className="category-row">{categories.map(c => <button key={c} className={'category' + (category === c ? ' active' : '')} onClick={() => setCategory(c)} aria-pressed={category === c}>{c}</button>)}</div><div className="results-line"><span>找到 {filteredRecipes.length} 道好味道</span>{hasPrefs && <span><Check size={14}/>已应用你的忌口与用时偏好</span>}</div>{filteredRecipes.length ? <div className="recipe-grid">{filteredRecipes.map(renderCard)}</div> : <Empty title="小厨房暂时没有这道菜" text="换个菜名或食材试试看，也可以调整选菜偏好。"><button className="secondary-button" onClick={() => {setQuery('');setCategory('全部');}}>清空搜索和分类</button></Empty>}</div>}

      {page === 'community' && <div className="page-content inner-page"><div className="page-title"><div><span className="page-kicker"><Users size={18}/>有人认真吃饭，就有人认真生活</span><h1>好友饭圈</h1><p>一人食，也有人一起分享好滋味。</p></div><button className="primary-button" onClick={() => record()}><Camera size={18}/>晒晒我的一餐</button></div><div className="community-note"><Heart size={18}/><span>这里收藏真实的一餐一饭。你的日记只有选择“发布到小饭圈”才会出现在这里。</span></div><Feed scope="community" user={user} refreshKey={refreshKey} onRecord={() => record()} onLogin={() => setDialog('login')} onOpen={openRecipe}/></div>}

      {page === 'book' && <div className="page-content inner-page"><div className="profile-hero"><div className="profile-illustration"><Tomato size={86}/></div><div><span className="page-kicker">给每一顿认真吃的饭，留个位置</span><h1>{user ? user.name + '的饭本' : '我的饭本'}</h1><p>{currentPersonality ? currentPersonality.title + ' · ' + currentPersonality.description : '你的收藏、你的日常，都在这一页。'}</p><div className="profile-links"><button className="text-button" onClick={() => setDialog('personality')}><Flower2 size={17}/>{currentPersonality ? '重新测测美食人格' : '发现我的美食人格'}</button><button className="text-button" onClick={() => setDialog('preferences')}><SlidersHorizontal size={16}/>选菜偏好</button></div></div><button className="primary-button" onClick={() => record()}><Camera size={18}/>记录一餐</button></div><div className="book-tabs"><button className={bookTab === 'favorites' ? 'active' : ''} onClick={() => setBookTab('favorites')}><Heart size={18}/>心头好收藏 <span>{favorites.length}</span></button><button className={bookTab === 'diary' ? 'active' : ''} onClick={() => setBookTab('diary')}><NotebookPen size={18}/>饭饭日记</button></div>{bookTab === 'favorites' ? <>{!user && favorites.length > 0 && <p className="storage-note">这些收藏保存在当前设备。登录后可使用账号饭本。</p>}{favorites.length ? <div className="recipe-grid">{recipes.filter(r => favorites.includes(r.id)).map(renderCard)}</div> : <Empty icon={<Heart size={42}/>} title="心头好，慢慢攒" text="遇到想做的菜，点一下小爱心，下次就能在这里找到。"><button className="primary-button" onClick={() => goTo('recipes')}>去看看今天的菜谱</button></Empty>}</> : <Feed scope="mine" user={user} refreshKey={refreshKey} onRecord={() => record()} onLogin={() => setDialog('login')} onOpen={openRecipe}/>}</div>}
    </main>

    <footer className="site-footer"><div className="footer-brand"><Tomato size={30}/><strong>食来运转</strong><span>认真吃饭，快乐加餐。</span></div><p>美食占卜与人格测试仅供趣味娱乐。热量为估算值。</p><button className="text-button" onClick={() => setDialog('preferences')}>你的口味，你来决定 <Heart size={14}/></button></footer>
    <nav className="mobile-nav" aria-label="手机导航">{([{id:'home',label:'今日灵感',icon:Sparkles},{id:'recipes',label:'小厨房',icon:ChefHat},{id:'community',label:'小饭圈',icon:Users},{id:'book',label:'我的饭本',icon:BookOpen}] as const).map(({id,label,icon:Icon}) => <button key={id} className={page === id ? 'active' : ''} onClick={() => goTo(id)} aria-current={page === id ? 'page' : undefined}><Icon size={22}/><span>{label}</span></button>)}</nav>

    {dialog === 'fortune' && <Modal title="今天的美味，藏在哪张牌里？" subtitle="凭第一感觉选一张，拆开你的今日幸运菜。" onClose={closeDialog}><FortuneTool candidates={candidates} seed={(today || dayKey()) + ':' + (user?.id || visitorId)} onOpen={openRecipe} onPrefs={() => setDialog('preferences')}/></Modal>}
    {dialog === 'wheel' && <Modal title="今天吃什么大转盘" subtitle="选择困难到此结束。转一圈，认真吃一餐。" onClose={closeDialog}><WheelTool candidates={candidates} onOpen={openRecipe} onPrefs={() => setDialog('preferences')}/></Modal>}
    {dialog === 'personality' && <Modal title="每一口，都是你的美食人格" subtitle="没有标准答案，选最像你的那一个。" onClose={closeDialog}><PersonalityTool onResult={savePersonality} onOpen={openRecipe} allowedRecipeIds={candidates.map(r => r.id)}/></Modal>}
    {dialog === 'poll' && <Modal title="让饭搭子来决定" subtitle="自己纠结的事，让朋友一起选。" onClose={closeDialog}><PollTool user={user} candidates={candidates} initialId={initialPoll} onLogin={() => setDialog('login')} onOpen={openRecipe} onToast={setToast}/></Modal>}
    {dialog === 'preferences' && <Modal title="好吃，也要合你的口味" subtitle="这些偏好会用于幸运抽签、转盘和菜谱筛选，保存在当前设备。" onClose={closeDialog}><PreferencesForm value={prefs} onChange={savePrefs} onDone={() => { closeDialog(); setToast('记住啦！接下来按你的口味选菜'); }} count={candidates.length}/></Modal>}
    {dialog === 'recipe' && selectedRecipe && <Modal title={selectedRecipe.title} onClose={closeDialog} wide><RecipeDetail key={selectedRecipe.id} recipe={selectedRecipe} favorite={favorites.includes(selectedRecipe.id)} onFavorite={() => toggleFavorite(selectedRecipe.id)} onRecord={() => record(selectedRecipe)}/></Modal>}
    {dialog === 'record' && <Modal title="记下这一餐的小幸福" subtitle="照片、心情，还有认真吃饭的你。" onClose={closeDialog}><RecordForm user={user} aiAvailable={aiAvailable} initialRecipe={recordRecipe} onLogin={() => setDialog('login')} onSaved={() => {closeDialog();setRefreshKey(k => k+1);setPage('book');setBookTab('diary');setToast('这一餐，已经好好收进饭本啦');}}/></Modal>}
    {dialog === 'login' && <Modal title="给你的饭本，留一个专属位置" onClose={closeDialog}><Empty icon={<Tomato size={76}/>} title="登录后，把美味好好收藏" text="保存照片日记、发起朋友投票，都需要先登录。"><a className="primary-button" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search)} target="_top"><LogIn size={18}/>使用 ChatGPT 登录</a></Empty></Modal>}
    {toast && <div className="toast" role="status"><Check size={18}/>{toast}</div>}
  </div>;
}

function PreferencesForm({ value, onChange, onDone, count }: { value: Preferences; onChange: (p: Preferences) => void; onDone: () => void; count: number }) {
  return <div className="preferences-form"><h3>这些食材，先不选</h3><p className="muted">选择需要避开的食材类别。包装食品的配料也请自行核对。</p><div className="allergen-options">{allergens.map(item => <button key={item} className={value.excluded.includes(item) ? 'selected' : ''} aria-pressed={value.excluded.includes(item)} onClick={() => onChange({...value,excluded:value.excluded.includes(item)?value.excluded.filter(x=>x!==item):[...value.excluded,item]})}>{item}{value.excluded.includes(item)&&<Check size={15}/>}</button>)}</div><h3>今天有多少时间做饭？</h3><div className="time-options">{[{value:0,label:'慢慢来，不限时'},{value:15,label:'15 分钟内'},{value:20,label:'20 分钟内'},{value:30,label:'30 分钟内'}].map(item => <button key={item.value} className={value.maxTime===item.value?'selected':''} onClick={()=>onChange({...value,maxTime:item.value})} aria-pressed={value.maxTime===item.value}><Clock3 size={16}/>{item.label}</button>)}</div><label className="vegetarian-option"><input type="checkbox" checked={value.vegetarian} onChange={e=>onChange({...value,vegetarian:e.target.checked})}/><span><strong>这次想吃素</strong><small>不含肉、鱼虾，保留蛋和奶。</small></span><span className="toggle-visual" aria-hidden="true"/></label><p className="preference-result">现在有 <strong>{count}</strong> 道菜符合你的偏好。{count === 0 ? '可以放宽时间限制，或调整食材选择。' : '一会儿见，好味道！'}</p><div className="button-row"><button className="text-button" onClick={()=>onChange(defaultPrefs)}>重置偏好</button><button className="primary-button" onClick={onDone}><Check size={17}/>就按这个选</button></div></div>;
}
