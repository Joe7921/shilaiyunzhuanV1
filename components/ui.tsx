'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X, Heart, Clock3, ChefHat } from 'lucide-react';
import type { Recipe } from '@/lib/recipes';

export function Tomato({ size = 40 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 18C6 22 4 42 15 52c8 9 29 9 37-2 9-12 5-26-7-32" fill="#F17C72" stroke="#69483C" strokeWidth="2.5" /><path d="m31 19-10-9 12 3 6-9 1 12 12 4-14 3-6 8-2-9-12 3Z" fill="#8CA66D" stroke="#69483C" strokeWidth="2.2" strokeLinejoin="round"/><ellipse cx="23" cy="36" rx="2" ry="3" fill="#69483C"/><ellipse cx="42" cy="36" rx="2" ry="3" fill="#69483C"/><path d="M28 42q5 5 10 0" stroke="#69483C" strokeWidth="2.3" strokeLinecap="round"/><ellipse cx="17" cy="41" rx="4" ry="2.5" fill="#F6AAA1"/><ellipse cx="47" cy="41" rx="4" ry="2.5" fill="#F6AAA1"/></svg>;
}

export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (element && !element.open) element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={ref} className={'modal' + (wide ? ' modal-wide' : '')} onCancel={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} aria-label={title}>
    <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button close-button" aria-label="关闭弹窗" onClick={onClose}><X size={22}/></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}

export function FoodImage({ recipe, className = '' }: { recipe: Recipe; className?: string }) {
  return <img className={'dish-photo ' + className} src={recipe.image} alt={recipe.title} width={600} height={450} loading="lazy" decoding="async"/>;
}

export function RecipeCard({ recipe, favorite, onFavorite, onOpen }: { recipe: Recipe; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return <article className="recipe-card">
    <button className="recipe-picture" onClick={onOpen} aria-label={'查看' + recipe.title + '做法'}><FoodImage recipe={recipe}/><span className="recipe-badge">{recipe.tags[0]}</span></button>
    <button className={'favorite-button' + (favorite ? ' is-favorite' : '')} onClick={onFavorite} aria-label={(favorite ? '取消收藏' : '收藏') + recipe.title} aria-pressed={favorite}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button>
    <div className="recipe-info"><button className="recipe-title" onClick={onOpen}>{recipe.title}</button><p>{recipe.description}</p><div className="recipe-meta"><span><Clock3 size={15}/>{recipe.time} 分钟</span><span><ChefHat size={16}/>{recipe.difficulty}</span><span>{Math.round(recipe.kcal / recipe.servings)} 千卡/人</span></div></div>
  </article>;
}

export function Empty({ icon, title, text, children }: { icon?: ReactNode; title: string; text: string; children?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon || <Tomato size={64}/>}</div><h3>{title}</h3><p>{text}</p>{children}</div>;
}
