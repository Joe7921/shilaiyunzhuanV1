'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Dice5, RefreshCw, Sparkles, Star, Users, Utensils } from 'lucide-react';
import { recipes, type Recipe } from '@/lib/recipes';
import {FoodIcon} from './food-icons';
import {Sun,Moon,Flower2} from 'lucide-react';
import {arrangeWheel} from '@/lib/wheel';
import { api, hash, type Poll, type User } from '@/lib/client';
import { Empty, FoodImage } from '@/components/ui';

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : '厨房暂时忙碌，请再试一次。';
}

export function FortuneTool({ candidates, seed, onOpen, onPrefs }: {
  candidates: Recipe[];
  seed: string;
  onOpen: (recipe: Recipe) => void;
  onPrefs: () => void;
}) {
  const [flipped, setFlipped] = useState<number | null>(null);
  const candidateKey = candidates.map((recipe) => recipe.id).sort().join('|');
  const fortune = useMemo(() => {
    const ordered = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
    if (!ordered.length) return null;
    const recipe = ordered[hash(seed + '|' + candidateKey) % ordered.length];
    return { recipe, number: hash(seed + ':lucky-number') % 9 + 1 };
  }, [candidateKey, seed]);
  useEffect(() => { setFlipped(null); }, [candidateKey, seed]);

  if (!fortune) return <Empty title="今天的牌桌还空着" text="当前偏好下没有匹配的菜，可以放宽做饭时间或稍后添加更多菜谱，再来抽签吧。"><button className="secondary-button" onClick={onPrefs}>查看饮食偏好</button></Empty>;
  const { recipe, number } = fortune;
  const ingredient = recipe.luckyIngredient;
  return <div className="fortune-tool">
    <p className="tool-intro">想一想今天的心情，选一张有眼缘的牌。</p>
    <div className="fortune-deck" aria-label="选择一张今日食物签">
      {[0, 1, 2].map((card) => <button key={card} type="button" className={'fortune-card' + (flipped === card ? ' is-flipped' : '') + (flipped !== null && flipped !== card ? ' is-dimmed' : '')} onClick={() => setFlipped(card)} disabled={flipped !== null} aria-label={'翻开第' + (card + 1) + '张食物签'}>
        <span className="fortune-card-corner"><Sparkles size={15}/></span>
        <span className="fortune-card-symbol">{flipped===card?<FoodIcon recipe={recipe} size={40}/>:card===0?<Sun size={40}/>:card===1?<Flower2 size={40}/>:<Moon size={40}/>}</span>
        <span className="fortune-card-label">{flipped === card ? '今日好食运' : ['太阳牌', '花朵牌', '月亮牌'][card]}</span>
        <span className="fortune-card-corner corner-end"><Sparkles size={15}/></span>
      </button>)}
    </div>
    {flipped !== null && <div className="fortune-result" aria-live="polite">
      <div className="fortune-lucky-grid"><div><span>幸运数字</span><strong>{number}</strong></div><div><span>幸运菜色</span><strong>{recipe.colorName}</strong></div><div><span>幸运食材</span><strong>{ingredient}</strong></div></div>
      <div className="tool-recipe-result"><FoodImage recipe={recipe} /><div><span className="pill"><Sparkles size={14}/> 今日幸运菜</span><h3>{recipe.title}</h3><p>{recipe.description}</p><button className="primary-button" onClick={() => onOpen(recipe)}>就做这道菜</button></div></div>
    </div>}
    <p className="muted fortune-note">食物签是趣味灵感，不预测运势。同一天、同一份饮食偏好下，今日幸运菜保持不变。</p>
  </div>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function WheelTool({ candidates, onOpen, onPrefs }: {
  candidates: Recipe[];
  onOpen: (recipe: Recipe) => void;
  onPrefs: () => void;
}) {
  const [round,setRound] = useState(0);
  const tables=useMemo(()=>arrangeWheel(candidates.filter(r=>!r.alcohol)),[candidates]);
  const options=tables[round % tables.length] || [];
  const optionKey = options.map((recipe) => recipe.id).join('|');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Recipe | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    busy.current = false; setSpinning(false); setRotation(0); setResult(null);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [optionKey]);
  if (!options.length) return <Empty icon={<Dice5 size={42}/>} title="转盘还缺几道菜" text="当前饮食偏好没有匹配菜谱，调整偏好后再来转一转。"><button className="secondary-button" onClick={onPrefs}>调整饮食偏好</button></Empty>;
  if (options.length === 1) return <div className="tool-single"><p className="tool-intro">当前偏好下只有一道匹配的菜，它已经等你开饭啦。</p><div className="tool-recipe-result"><FoodImage recipe={options[0]}/><div><h3>{options[0].title}</h3><p>{options[0].description}</p><button className="primary-button" onClick={() => onOpen(options[0])}>看看这道菜</button><button className="text-button" onClick={onPrefs}>调整偏好，增加候选</button></div></div></div>;
  const segment = 360 / options.length;
  const fills = ['#FFD8C8', '#F7E6A9', '#D9E6C6', '#F5D3DB', '#E1D9EC', '#DBE8EB'];
  const point = (angle: number, radius: number) => ({ x: 180 + radius * Math.cos(angle * Math.PI / 180), y: 180 + radius * Math.sin(angle * Math.PI / 180) });
  function spin() {
    if (busy.current) return;
    busy.current = true; setSpinning(true); setResult(null);
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const chosen = Math.floor((random[0] / 4294967296) * options.length);
    // Slice zero begins at twelve o'clock. Rotate the selected slice's centre to the fixed top pointer.
    const target = (360 - ((chosen + 0.5) * segment)) % 360;
    const delta = ((target - rotation % 360) + 360) % 360;
    setRotation(rotation + 4 * 360 + delta);
    const finish = () => { setResult(options[chosen]); setSpinning(false); busy.current = false; };
    if (reducedMotion) finish();
    else timer.current = setTimeout(finish, 2050);
  }
  return <div className="wheel-tool"><div className="wheel-table-head"><p>本桌 <b>{options.length}</b> 道 · 共 {tables.length} 桌可转</p>{tables.length>1 && <button className="secondary-button" disabled={spinning} onClick={()=>setRound(n=>n+1)}>换一桌</button>}</div>
    <div className="wheel-stage"><span className="wheel-pointer" aria-hidden="true"/><svg className="food-wheel" viewBox="0 0 360 360" role="img" aria-label={'今日吃什么转盘，共' + options.length + '道候选菜'} style={{ transform: `rotate(${rotation}deg)`, transition: reducedMotion ? 'none' : 'transform 2s cubic-bezier(.15,.7,.15,1)' }}>
      {options.map((recipe, index) => {
        const start = point(-90 + index * segment, 170);
        const end = point(-90 + (index + 1) * segment, 170);
        const middle = -90 + (index + 0.5) * segment;
        const label = point(middle, 112);
        return <g key={recipe.id}><path d={`M180 180 L${start.x} ${start.y} A170 170 0 ${segment > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`} fill={fills[index % fills.length]} stroke="#fff9ed" strokeWidth="3"/><g transform={`translate(${label.x},${label.y}) rotate(${middle + 90})`}><FoodIcon recipe={recipe} size={25} x={-12.5} y={-24}/><text x="0" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill="#654C43">{index + 1}</text></g></g>;
      })}<circle cx="180" cy="180" r="168" fill="none" stroke="#79584B" strokeWidth="3"/>
    </svg><span className="wheel-centre" aria-hidden="true"><Utensils size={23}/></span></div>
    <button className="primary-button wheel-spin" onClick={spin} disabled={spinning}><RefreshCw size={18} className={spinning ? 'is-spinning' : ''}/>{spinning ? '美味转呀转…' : result ? '再转一次' : '转一转，决定吃什么'}</button>
    <div className="wheel-options">{options.map((recipe, index) => <span key={recipe.id} className={'wheel-option' + (result?.id === recipe.id ? ' is-selected' : '')}><i style={{ background: fills[index % fills.length] }}>{index + 1}</i>{recipe.title}</span>)}</div>
    {result && <div className="wheel-result" aria-live="polite"><span>转盘替你选好了</span><h3><FoodIcon recipe={result}/> {result.title}</h3><button className="secondary-button" onClick={() => onOpen(result)}>查看这道菜的做法</button></div>}
  </div>;
}

export function PollTool({ user, candidates, initialId, onLogin, onOpen, onToast }: {
  user: User | null;
  candidates: Recipe[];
  initialId?: string;
  onLogin: () => void;
  onOpen: (recipe: Recipe) => void;
  onToast: (text: string) => void;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [title, setTitle] = useState('今天吃什么？帮我选一道吧！');
  const [search,setSearch]=useState('');
  const [selected, setSelected] = useState<string[]>(() => candidates.slice(0, 3).map((recipe) => recipe.id));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!initialId);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');
  const [copyFallback, setCopyFallback] = useState(false);
  const [recentPolls, setRecentPolls] = useState<{ id: string; title: string; totalVotes: number; createdAt: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const linkInput = useRef<HTMLInputElement>(null);
  const candidateKey = candidates.map((recipe) => recipe.id).join('|');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => { setSelected((previous) => previous.filter((id) => candidates.some((recipe) => recipe.id === id))); }, [candidateKey]);
  useEffect(() => {
    let active = true;
    if (!initialId || !user) { setLoading(false); return; }
    setLoading(true); setError('');
    api<{ poll: Poll }>('?resource=poll&id=' + encodeURIComponent(initialId)).then((data) => { if (active) setPoll(data.poll); }).catch((reason) => { if (active) setError(messageOf(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialId, user?.id]);
  useEffect(() => {
    let active = true;
    if (!user || initialId) { setRecentPolls([]); setHistoryLoading(false); return; }
    setHistoryLoading(true); setHistoryError('');
    api<{ polls: typeof recentPolls }>('?resource=polls')
      .then((data) => { if (active) setRecentPolls(data.polls); })
      .catch((reason) => { if (active) setHistoryError(messageOf(reason)); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [initialId, user?.id]);

  if (!user) return <Empty icon={<Users size={42}/>} title="和朋友一起决定这一餐" text="登录后可以发起投票、参与投票，也能保存大家的选择。"><button className="primary-button" onClick={onLogin}>登录后继续</button></Empty>;
  async function refreshHistory() {
    setHistoryLoading(true); setHistoryError('');
    try { const data = await api<{ polls: typeof recentPolls }>('?resource=polls'); setRecentPolls(data.polls); }
    catch (reason) { setHistoryError(messageOf(reason)); }
    finally { setHistoryLoading(false); }
  }
  function updateHistoryCount(current: Poll) {
    setRecentPolls((previous) => previous.map((item) => item.id === current.id ? { ...item, totalVotes: current.totalVotes } : item));
  }
  async function loadPoll(id: string) {
    setBusy(true); setError('');
    try { const data = await api<{ poll: Poll }>('?resource=poll&id=' + encodeURIComponent(id)); setPoll(data.poll); updateHistoryCount(data.poll); }
    catch (reason) { setError(messageOf(reason)); }
    finally { setBusy(false); }
  }
  async function createPoll(event: React.FormEvent) {
    event.preventDefault();
    if (busy || selected.length < 2 || selected.length > 6) return;
    if (!title.trim()) { setError('给这次投票起个名字吧。'); return; }
    setBusy(true); setError('');
    try {
      const options = selected.map((id) => { const recipe = candidates.find((item) => item.id === id)!; return { id, label: recipe.title }; });
      const data = await api<{ poll: Poll }>('', { action: 'create-poll', title: title.trim(), options });
      setPoll(data.poll); onToast('投票已创建，可以把链接发给朋友了。');
      setRecentPolls((previous) => [{ id: data.poll.id, title: data.poll.title, totalVotes: data.poll.totalVotes, createdAt: new Date().toISOString() }, ...previous.filter((item) => item.id !== data.poll.id)].slice(0, 20));
      await refreshHistory();
    } catch (reason) { setError(messageOf(reason)); }
    finally { setBusy(false); }
  }
  async function vote(optionId: string) {
    if (busy || !poll || poll.myVote === optionId) return;
    setBusy(true); setError('');
    try { const data = await api<{ poll: Poll }>('', { action: 'vote', id: poll.id, optionId }); setPoll(data.poll); updateHistoryCount(data.poll); onToast(poll.myVote ? '已更新你的选择。' : '你的这一票已记下。'); }
    catch (reason) { setError(messageOf(reason)); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    if (!poll) return;
    try { await navigator.clipboard.writeText(origin + '/?poll=' + encodeURIComponent(poll.id)); setCopyFallback(false); onToast('投票链接已复制。'); }
    catch { setCopyFallback(true); linkInput.current?.focus(); linkInput.current?.select(); }
  }
  if (loading) return <div className="tool-loading" role="status"><RefreshCw size={24}/><p>正在端上朋友的投票…</p></div>;
  if (initialId && !poll) return <Empty title="暂时没找到这张饭票" text={error || '这次投票可能已被删除，或你还没有访问权限。'}><button className="secondary-button" disabled={busy} onClick={() => loadPoll(initialId)}>再试一次</button></Empty>;
  if (poll) {
    const shareLink = origin + '/?poll=' + encodeURIComponent(poll.id);
    return <div className="poll-tool"><div className="poll-title-row"><div><span className="pill"><Users size={14}/> 朋友帮你选</span><h3>{poll.title}</h3></div><button className="text-button" onClick={() => loadPoll(poll.id)} disabled={busy}><RefreshCw size={16}/>刷新</button></div><p className="muted">已收到 {poll.totalVotes} 票。每人一票，可以改选。</p>
      <div className="poll-results">{poll.options.map((option) => {
        const percentage = poll.totalVotes ? Math.round(option.votes / poll.totalVotes * 100) : 0;
        const recipe = recipes.find((item) => item.id === option.id);
        return <div className={'poll-result-option' + (poll.myVote === option.id ? ' is-voted' : '')} key={option.id}><button className="poll-vote-button" onClick={() => vote(option.id)} disabled={busy || poll.myVote === option.id} aria-pressed={poll.myVote === option.id}><span className="poll-option-name"><FoodIcon recipe={recipe}/> {option.label}{poll.myVote === option.id && <Check size={17}/>}</span><span className="poll-vote-count">{option.votes} 票 · {percentage}%</span><span className="poll-bar"><i style={{ width: percentage + '%' }}/></span></button>{recipe && <button className="text-button poll-recipe-button" onClick={() => onOpen(recipe)}>看做法</button>}</div>;
      })}</div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="poll-share"><label className="form-label" htmlFor="poll-share-link">邀请朋友来投票</label><div className="poll-share-row"><input ref={linkInput} id="poll-share-link" className="field" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()}/><button className="secondary-button" onClick={copyLink}><Copy size={16}/>复制链接</button></div><p className="muted">朋友需有网站访问权限。</p>{copyFallback && <p className="inline-error" role="status">浏览器暂不支持自动复制，请长按上方链接复制。</p>}</div>
      {!initialId && <button className="text-button" onClick={() => { setPoll(null); setError(''); setCopyFallback(false); }}>发起新的投票</button>}
    </div>;
  }
  const history = !initialId && (historyLoading || historyError || recentPolls.length > 0) ? <section className="poll-history" aria-labelledby="poll-history-heading"><div className="poll-history-head"><h4 id="poll-history-heading">我发起的投票</h4><span className="muted">最近 20 场</span></div>{historyLoading && <p className="muted" role="status">正在找回你的饭票…</p>}{historyError && <div className="poll-history-error"><p className="muted">之前的投票暂时没有加载成功，你仍可以发起新投票。</p><button type="button" className="text-button" disabled={historyLoading} onClick={refreshHistory}>重试加载</button></div>}{recentPolls.length > 0 && <div className="poll-history-list">{recentPolls.map((item) => <button type="button" className="poll-history-item" key={item.id} onClick={() => loadPoll(item.id)} disabled={busy}><span>{item.title}</span><span className="muted">{item.totalVotes} 票</span></button>)}</div>}</section> : null;
  if (candidates.length < 2) return <div className="poll-tool">{history}<Empty icon={<Users size={42}/>} title="至少准备两道候选菜" text="当前偏好下的菜谱不足两道，可以放宽做饭时间或稍后添加更多菜谱。"/>{error && <p className="inline-error" role="alert">{error}</p>}</div>;
  return <div className="poll-tool">{history}<form onSubmit={createPoll}><label className="form-label" htmlFor="poll-title">这次想让朋友帮你决定什么？</label><input id="poll-title" className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required/><div className="poll-selection-head"><span className="form-label">挑 2–6 道候选菜</span><span className="muted">已选 {selected.length} / 6</span></div><input className="field" aria-label="搜索投票候选菜" placeholder="输入菜名或食材挑选候选菜" value={search} onChange={e=>setSearch(e.target.value)}/><div className="poll-choice-grid">{candidates.filter(r=>selected.includes(r.id)||[r.title,...r.aliases,...r.ingredients.map(i=>i.name)].some(s=>s.includes(search.trim()))).map((recipe) => {
    const checked = selected.includes(recipe.id);
    return <label key={recipe.id} className={'poll-choice' + (checked ? ' is-selected' : '')}><input type="checkbox" checked={checked} disabled={busy || (!checked && selected.length >= 6)} onChange={() => { setSelected((previous) => checked ? previous.filter((id) => id !== recipe.id) : [...previous, recipe.id]); }}/><span><FoodIcon recipe={recipe}/></span><span>{recipe.title}</span>{checked && <Check size={16}/>}</label>;
  })}</div>{error && <p className="inline-error" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy || selected.length < 2 || selected.length > 6 || !title.trim()}><Users size={18}/>{busy ? '正在创建饭票…' : '创建投票，邀请朋友'}</button><p className="muted">创建后会得到专属链接，大家的投票会汇总在一起。</p></form></div>;
}
