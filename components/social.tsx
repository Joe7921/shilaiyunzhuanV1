'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Heart, LockKeyhole, Users, Trash2, RefreshCw, ImagePlus, Sparkles, LoaderCircle, X, Check, NotebookPen } from 'lucide-react';
import { recipes, type Recipe } from '@/lib/recipes';
import { api, formatDate, type Post, type User } from '@/lib/client';
import { Empty, FoodImage } from './ui';

export function Feed({ scope, user, refreshKey, onRecord, onLogin, onOpen }: { scope: 'community' | 'mine'; user: User | null; refreshKey: number; onRecord: () => void; onLogin: () => void; onOpen: (r: Recipe) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    let valid = true;
    setLoading(true); setError('');
    api<{posts: Post[]}>('?resource=posts&scope=' + scope).then(r => { if (valid) setPosts(r.posts); }).catch(e => { if (valid) setError(e.message); }).finally(() => { if (valid) setLoading(false); });
    return () => { valid = false; };
  }, [scope, refreshKey, version]);
  async function toggleLike(id: string) {
    if (!user) return onLogin();
    setPending(id); setError('');
    try { await api('', { action: 'toggle-like', id }); setVersion(v => v + 1); }
    catch(e) { setError((e as Error).message); }
    finally { setPending(null); }
  }
  async function remove(id: string) {
    setPending(id); setError('');
    try { await api('', { action: 'delete-post', id }); setPosts(p => p.filter(x => x.id !== id)); setDeleteId(null); }
    catch(e) { setError((e as Error).message); }
    finally { setPending(null); }
  }
  if (scope === 'mine' && !user) return <Empty icon={<NotebookPen size={42}/>} title="你的美食故事，从这里开始" text="登录后，把收藏和饭饭日记放在一起，下次回来还能接着看。"><button className="primary-button" onClick={onLogin}>登录，开启我的饭本</button></Empty>;
  if (loading) return <div className="loading-state"><LoaderCircle className="spin" size={25}/><p>端上热乎乎的日常…</p></div>;
  if (error && !posts.length) return <Empty title="小厨房暂时没连上" text={error}><button className="secondary-button" onClick={() => setVersion(v => v + 1)}><RefreshCw size={17}/>重新加载</button></Empty>;
  if (!posts.length) return <Empty icon={<Camera size={43}/>} title={scope === 'mine' ? '每一餐，都值得留下来' : '第一份烟火气，等你来晒'} text={scope === 'mine' ? '做了什么、吃了什么，拍张照片记下来吧。' : '今天的拿手菜，或是路边的小惊喜，都可以分享在这里。'}><button className="primary-button" onClick={onRecord}><Plus size={18}/>记录我的一餐</button></Empty>;
  return <>{error && <p className="inline-error" role="alert">{error}</p>}<div className="feed-grid">{posts.map(post => {
    const recipe = recipes.find(r => r.id === post.recipeId);
    return <article className="post-card" key={post.id}>{post.imageUrl ? <img className="post-image" src={post.imageUrl} alt={post.title} loading="lazy"/> : recipe ? <FoodImage recipe={recipe} className="post-image"/> : <div className="post-no-image"><span>一餐一记</span><NotebookPen size={48}/></div>}
      <div className="post-body"><div className="post-author"><span className="avatar-small">{post.authorName.slice(0, 1) || '饭'}</span><div><strong>{post.authorName}</strong><small>{formatDate(post.createdAt)}</small></div><span className="post-visibility" title={post.visibility === 'private' ? '仅自己可见' : '已分享至小饭圈'}>{post.visibility === 'private' ? <LockKeyhole size={15}/> : <Users size={15}/>}</span></div><h3>{post.title}</h3><p className="post-copy">{post.body}</p>{recipe && <button className="recipe-link" onClick={() => onOpen(recipe)}>这餐的菜谱：{recipe.title}</button>}<div className="post-bottom">{post.kcal != null && <span>约 {Math.round(post.kcal)} 千卡</span>}<button className={'like-button' + (post.likedByMe ? ' is-liked' : '')} onClick={() => toggleLike(post.id)} disabled={pending === post.id} aria-label={(post.likedByMe ? '取消点赞' : '点赞') + post.title}><Heart size={17} fill={post.likedByMe ? 'currentColor' : 'none'}/>{post.likes || '喜欢'}</button>{post.isMine && <button className="icon-button" aria-label={'删除' + post.title} onClick={() => setDeleteId(post.id)}><Trash2 size={16}/></button>}</div>
      {deleteId === post.id && <div className="delete-confirm"><p>确定删除这条日记吗？</p><button className="text-button" onClick={() => setDeleteId(null)}>保留</button><button className="danger-button" onClick={() => remove(post.id)} disabled={pending === post.id}>确认删除</button></div>}</div>
    </article>;
  })}</div><div className="feed-refresh"><button className="text-button" onClick={() => setVersion(v => v + 1)}><RefreshCw size={15}/>看看有没有新动态</button></div></>;
}

export function RecordForm({ user, aiAvailable, initialRecipe, onSaved, onLogin }: { user: User | null; aiAvailable: boolean; initialRecipe?: Recipe | null; onSaved: () => void; onLogin: () => void }) {
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [body, setBody] = useState('');
  const [recipeId, setRecipeId] = useState(initialRecipe?.id || '');
  const [portion, setPortion] = useState('1');
  const [kcal, setKcal] = useState(initialRecipe ? String(Math.round(initialRecipe.kcal / initialRecipe.servings)) : '');
  const [visibility, setVisibility] = useState<'private'|'community'>('private');
  const [imageKey, setImageKey] = useState('');
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState('');
  const [estimateNote, setEstimateNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  function changeRecipe(id: string) {
    setRecipeId(id);
    const recipe = recipes.find(r => r.id === id);
    if (recipe) { if (!title || recipes.some(r => r.title === title)) setTitle(recipe.title); setKcal(String(Math.round(recipe.kcal / recipe.servings * Number(portion || 1)))); }
  }
  function changePortion(value: string) {
    setPortion(value);
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) setKcal(String(Math.round(recipe.kcal / recipe.servings * Number(value || 1))));
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!user) return onLogin();
    setError('');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('请选择 5 MB 以内的 JPG、PNG 或 WebP 照片。'); return; }
    setUploading(true);
    const data = new FormData(); data.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await response.json() as { error?: string; imageKey: string; imageUrl: string };
      if (!response.ok) throw new Error(result.error || '照片没传上来，请重试。');
      setImageKey(result.imageKey); setPreview(URL.createObjectURL(file));
    } catch(e) { setError((e as Error).message); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  }
  async function estimate() {
    if (!imageKey) { setError('先上传一张这餐的照片吧。'); return; }
    setEstimating(true); setError('');
    try {
      const response = await fetch('/api/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageKey }) });
      const result = await response.json() as { error?: string; totalKcal?: number; note?: string; title?: string };
      if (!response.ok) throw new Error(result.error || '暂时无法识别，请手动填写。');
      if (typeof result.totalKcal !== 'number') throw new Error('识别结果还不完整，请手动确认食物和份量。');
      setKcal(String(Math.round(result.totalKcal)));
      setEstimateNote(result.note || '已按照片粗估，请核对食物和份量后再保存。');
      if (!title && result.title) setTitle(result.title);
    } catch(e) { setError((e as Error).message); }
    finally { setEstimating(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return onLogin();
    if (uploading || saving) return;
    setSaving(true); setError('');
    try { await api('', { action: 'create-post', title: title.trim(), body: body.trim(), imageKey: imageKey || undefined, recipeId: recipeId || undefined, kcal: kcal === '' ? undefined : Number(kcal), visibility }); onSaved(); }
    catch(e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  if (!user) return <Empty icon={<Camera size={44}/>} title="先认个脸，再记一餐" text="用 ChatGPT 登录，照片和饭本就能安全地留在你的账号里。"><button className="primary-button" onClick={onLogin}>登录后记录</button></Empty>;
  return <form onSubmit={submit} className="record-form">
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => upload(e.target.files?.[0])}/>
    {preview ? <div className="upload-preview"><img src={preview} alt="这一餐的照片预览"/><button type="button" className="icon-button remove-image" aria-label="移除照片" onClick={() => { setImageKey(''); setPreview(''); }}><X size={18}/></button><button type="button" className="photo-change" onClick={() => inputRef.current?.click()} disabled={uploading}>换一张照片</button></div> : <button type="button" className="upload-zone" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle size={30} className="spin"/> : <ImagePlus size={34}/>}<strong>{uploading ? '正在把照片放进饭本…' : '拍一张，留住这一餐'}</strong><span>选择照片 · JPG / PNG / WebP，最多 5 MB</span></button>}
    <label className="form-label" htmlFor="record-title">今天吃了什么？</label><input id="record-title" className="field" maxLength={80} required value={title} onChange={e => setTitle(e.target.value)} placeholder="比如：第一次成功的番茄炒蛋"/>
    <label className="form-label" htmlFor="record-body">给这餐写句话</label><textarea id="record-body" className="field" rows={3} maxLength={1000} value={body} onChange={e => setBody(e.target.value)} placeholder="今天的心情、做饭的小发现，都可以记下来…"/>
    <div className="nutrition-box"><div className="nutrition-title"><strong>也记一下热量</strong><span className="muted">可选</span></div><div className="nutrition-fields"><label>关联菜谱<select className="field" value={recipeId} onChange={e => changeRecipe(e.target.value)}><option value="">自己的一餐</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label><label>吃了几人份<input className="field" type="number" min="0.25" max="8" step="0.25" value={portion} onChange={e => changePortion(e.target.value)}/></label><label>估算热量 / 千卡<input className="field" type="number" min="0" max="20000" step="1" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="可留空"/></label></div><p className="muted">选菜谱后按份量粗估，你可以修改数值。照片无法精确量出食材和用油。</p><button type="button" className="secondary-button ai-estimate" onClick={estimate} disabled={!aiAvailable || estimating || !imageKey}>{estimating ? <LoaderCircle size={16} className="spin"/> : <Sparkles size={16}/>}AI 照片估算{!aiAvailable ? ' · 待连接' : ''}</button>{!aiAvailable && <small>照片识别服务尚未连接，现在可以使用上方的菜谱份量估算。</small>}{estimateNote && <p className="muted">{estimateNote}</p>}</div>
    <fieldset className="visibility-field"><legend>这份快乐，想分享给谁？</legend><label className={visibility === 'private' ? 'selected' : ''}><input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')}/><LockKeyhole size={18}/><span>仅自己可见</span></label><label className={visibility === 'community' ? 'selected' : ''}><input type="radio" name="visibility" value="community" checked={visibility === 'community'} onChange={() => setVisibility('community')}/><Users size={18}/><span>发布到小饭圈</span></label></fieldset>
    {visibility === 'community' && <p className="muted">发布后，能访问本站的朋友可以看到照片与文字。</p>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    <button className="primary-button full-width" disabled={saving || uploading || estimating || !title.trim()} type="submit">{saving ? <LoaderCircle className="spin" size={19}/> : <Check size={19}/>} {saving ? '正在保存…' : visibility === 'private' ? '保存到我的饭本' : '发布到小饭圈'}</button>
  </form>;
}
