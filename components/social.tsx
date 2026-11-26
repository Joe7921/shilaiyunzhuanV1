'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Heart, LockKeyhole, Users, Trash2, RefreshCw, ImagePlus, Sparkles, LoaderCircle, X, Check, NotebookPen } from 'lucide-react';
import { recipes, type Recipe } from '@/lib/recipes';
import { api, formatDate, type Post, type User } from '@/lib/client';
import {MealConfirmation} from './meal-confirmation';
import {identifyDish,type SuggestedDish} from '@/lib/vision/prediction';
import type {Meal} from '@/lib/vision/meal';
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
      <div className="post-body"><div className="post-author"><span className="avatar-small">{post.authorName.slice(0, 1) || '饭'}</span><div><strong>{post.authorName}</strong><small>{formatDate(post.createdAt)}</small></div><span className="post-visibility" title={post.visibility === 'private' ? '仅自己可见' : '已分享至小饭圈'}>{post.visibility === 'private' ? <LockKeyhole size={15}/> : <Users size={15}/>}</span></div><h3>{post.title}</h3><p className="post-copy">{post.body}</p>{recipe && <button className="recipe-link" onClick={() => onOpen(recipe)}>这餐的菜谱：{recipe.title}</button>}{post.mealEstimate&&<details className="meal-ledger"><summary>这餐确认的菜品与份量</summary>{post.mealEstimate.items.map((r,i)=><p key={i}>{r.title} · {r.amount}{r.unit} · 约 {r.kcal} 千卡</p>)}</details>}<div className="post-bottom">{post.kcal != null && <span>约 {Math.round(post.kcal)} 千卡</span>}<button className={'like-button' + (post.likedByMe ? ' is-liked' : '')} onClick={() => toggleLike(post.id)} disabled={pending === post.id} aria-label={(post.likedByMe ? '取消点赞' : '点赞') + post.title}><Heart size={17} fill={post.likedByMe ? 'currentColor' : 'none'}/>{post.likes || '喜欢'}</button>{post.isMine && <button className="icon-button" aria-label={'删除' + post.title} onClick={() => setDeleteId(post.id)}><Trash2 size={16}/></button>}</div>
      {deleteId === post.id && <div className="delete-confirm"><p>确定删除这条日记吗？</p><button className="text-button" onClick={() => setDeleteId(null)}>保留</button><button className="danger-button" onClick={() => remove(post.id)} disabled={pending === post.id}>确认删除</button></div>}</div>
    </article>;
  })}</div><div className="feed-refresh"><button className="text-button" onClick={() => setVersion(v => v + 1)}><RefreshCw size={15}/>看看有没有新动态</button></div></>;
}

export function RecordForm({user,initialRecipe,onSaved,onLogin}:{user:User|null;initialRecipe?:Recipe|null;onSaved:()=>void;onLogin:()=>void}){
 const [title,setTitle]=useState(initialRecipe?.title||''),[body,setBody]=useState('');
 const [visibility,setVisibility]=useState<'private'|'community'>('private');
 const [photo,setPhoto]=useState<{url:string;file?:File}|null>(null),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false);
 const [candidates,setCandidates]=useState<SuggestedDish[]|null>(null),[confirmed,setConfirmed]=useState<Meal|null>(null);
 const [generation,bump]=useState(0),[error,setError]=useState(''),[scanError,setScanError]=useState(''),[manual,setManual]=useState(''),[showManual,setShowManual]=useState(false),[needsConfirm,setNeedsConfirm]=useState(false);
 const input=useRef<HTMLInputElement>(null),img=useRef<HTMLImageElement>(null),seq=useRef(0),uploaded=useRef(''),savingRef=useRef(false);
 useEffect(()=>()=>{seq.current++},[]);
 useEffect(()=>()=>{if(photo?.url.startsWith('blob:'))URL.revokeObjectURL(photo.url)},[photo]);
 function resetEstimate(){setConfirmed(null);setManual('');setShowManual(false);setNeedsConfirm(true);}
 function replace(p:typeof photo){
   seq.current++;uploaded.current='';setPhoto(p);setCandidates(null);setError('');setScanError('');setBusy(false);setConfirmed(null);setManual('');setShowManual(false);setNeedsConfirm(false);bump(x=>x+1);
 }
 function choose(file?:File){
   if(input.current)input.current.value='';if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('请选择 5 MB 以内的 JPG、PNG 或 WebP。');return}
   replace({url:URL.createObjectURL(file),file});
 }
 async function scan(){
   if(!photo||!img.current||busy)return;const request=++seq.current;resetEstimate();setCandidates(null);bump(n=>n+1);setScanError('');setBusy(true);
   try{const found=await identifyDish(img.current);if(seq.current===request)setCandidates(found);}
   catch{if(seq.current===request)setScanError('本机模型未能完成识别。请检查网络后重试，也可手动选菜。');}
   finally{if(seq.current===request)setBusy(false);}
 }
 function accept(m:Meal){setConfirmed(m);setNeedsConfirm(false);setManual('');setShowManual(false);setError('');if(!title.trim()||recipes.some(r=>r.title===title))setTitle(m.items.map(x=>x.title).join('、').slice(0,80));}
 async function submit(e:React.FormEvent){
   e.preventDefault();if(!user){onLogin();return}if(savingRef.current||busy)return;
   if(needsConfirm&&!showManual){setError('请先确认菜品和份量，或选择只记照片。');return}
   const manualKcal=showManual&&manual.trim()!==''?Number(manual):undefined;
   if(manualKcal!==undefined&&(!Number.isFinite(manualKcal)||manualKcal<0||manualKcal>20000)){setError('热量请输入 0–20000 范围内的数值。');return}
   savingRef.current=true;setSaving(true);setError('');
   try{
     if(photo?.file&&!uploaded.current){const data=new FormData();data.set('file',photo.file);const res=await fetch('/api/upload',{method:'POST',body:data});const r=await res.json() as {imageKey?:string; error?:string};if(!res.ok||!r.imageKey)throw Error(r.error||'照片没传上来，请重试。');uploaded.current=r.imageKey;}
     const single=confirmed?.items.length===1?confirmed.items[0].id:!confirmed&&!photo?initialRecipe?.id:undefined;
     await api('',{action:'create-post',title:title.trim(),body:body.trim(),imageKey:uploaded.current||undefined,recipeId:single&&recipes.some(r=>r.id===single)?single:undefined,kcal:confirmed?.kcal??manualKcal,mealItems:confirmed?.items.map(({id,amount})=>({id,amount})),visibility});onSaved();
   }catch(e){setError((e as Error).message)}finally{savingRef.current=false;setSaving(false);}
 }
 return <form className="record-form" onSubmit={submit}><fieldset className="meal-workflow" disabled={saving}>
 <input aria-label="选择美食照片" ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>choose(e.target.files?.[0])}/>
 {photo?<div className="upload-preview"><img ref={img} src={photo.url} alt="待识别的餐盘照片" onError={()=>setScanError('这张图片无法解码，请改用 JPG、PNG 或 WebP。')}/><button type="button" className="icon-button remove-image" aria-label="移除照片" onClick={()=>replace(null)}><X size={18}/></button><button type="button" className="photo-change" onClick={()=>input.current?.click()}>换一张照片</button></div>:<button type="button" className="upload-zone" onClick={()=>input.current?.click()}><ImagePlus size={32}/><strong>拍照或选一张美食照片</strong><span>JPG、PNG、WebP · 最多 5 MB</span></button>}
 <div className="scan-bar">{photo?<button type="button" className="primary-button" disabled={busy} onClick={scan}>{busy?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {busy?'正在本机识别…':candidates?'再识别一次':'识别照片中的菜品'}</button>:<button type="button" className="text-button" onClick={()=>replace({url:'/images/world/kung-pao-chicken.webp'})}>用宫保鸡丁示例试试</button>}</div>
 <p className="muted">照片在本机识别，首次使用需下载模型。只有保存饭本时才上传你选择的照片。</p>{busy&&<p role="status">正在准备模型并读取照片，请稍候。</p>}{scanError&&<p role="alert" className="inline-error">{scanError}</p>}
 <MealConfirmation key={generation} suggestions={candidates} initialId={photo?'':initialRecipe?.id||''} onChange={resetEstimate} onConfirm={accept} confirmed={confirmed}/>
 <button type="button" className="text-button" onClick={()=>{setShowManual(true);setNeedsConfirm(false);setConfirmed(null);setCandidates(null);setManual('');bump(n=>n+1)}}>只记照片或手填热量</button>{showManual&&<label className="form-label">手填热量（千卡，可留空）<input className="field" type="number" min="0" max="20000" value={manual} onChange={e=>setManual(e.target.value)}/></label>}
 <label className="form-label" htmlFor="record-title">今天吃了什么？</label><input id="record-title" className="field" maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="给这顿饭起个名字"/>
 <label className="form-label" htmlFor="record-body">给这餐写句话</label><textarea id="record-body" className="field" rows={2} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)} placeholder="记下做法、口感或心情"/>
 <fieldset className="visibility-field"><legend>这份记录谁可以看？</legend>{(['private','community'] as const).map(v=><label key={v} className={visibility===v?'selected':''}><input type="radio" name="visibility" checked={visibility===v} onChange={()=>setVisibility(v)}/>{v==='private'?<LockKeyhole size={16}/>:<Users size={16}/>} {v==='private'?'仅自己可见':'发布到小饭圈'}</label>)}</fieldset>
 {error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary-button full-width" disabled={saving||busy||(!!user&&!title.trim())} type="submit">{saving?<LoaderCircle size={17}/>:<Check size={17}/>} {saving?'正在保存…':!user?'登录后保存到饭本':visibility==='private'?'保存到我的饭本':'发布到小饭圈'}</button>
 </fieldset></form>;
}
