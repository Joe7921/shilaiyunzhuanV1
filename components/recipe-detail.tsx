'use client';

import { useState } from 'react';
import { Heart, Clock3, Users, ChefHat, Minus, Plus, Check, Camera, Flame } from 'lucide-react';
import type { Recipe } from '@/lib/recipes';
import ShareButton from './share-button';
import { FoodImage } from './ui';
import {RecipePitfalls} from './planner/pitfalls';

export default function RecipeDetail({ recipe, restricted, favorite, onFavorite, onRecord, onAlternative }: { recipe: Recipe; restricted:boolean; favorite: boolean; onFavorite: () => void; onRecord: () => void; onAlternative: (id:string)=>void }) {
  const [servings, setServings] = useState(recipe.servings);
  const [steps, setSteps] = useState<number[]>([]);
  const factor = servings / recipe.servings;
  const formatAmount = (amount: number) => Number((amount * factor).toFixed(2));
  return <div className="recipe-detail">
    <div className="detail-summary"><FoodImage recipe={recipe} className="detail-image"/><div className="detail-intro"><div className="tag-row">{recipe.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div><p>{recipe.description}</p><div className="detail-facts"><span><Clock3 size={17}/>{recipe.time} 分钟</span><span><ChefHat size={18}/>{recipe.difficulty}</span><span><Flame size={17}/>约 {Math.round(recipe.kcal / recipe.servings)} 千卡/人</span></div><div className="recipe-utilities"><button className={'secondary-button' + (favorite ? ' saved' : '')} onClick={onFavorite}><Heart size={18} fill={favorite ? 'currentColor' : 'none'}/>{favorite ? '已放进收藏夹' : '收藏这份美味'}</button><ShareButton recipe={recipe}/></div><small>{recipe.imageCredit}{recipe.imageSource && <> · <a href={recipe.imageSource} target="_blank" rel="noreferrer">原照片</a></>}{recipe.imageLicenseUrl&&<> · <a href={recipe.imageLicenseUrl} target="_blank" rel="noreferrer">图片许可</a></>}</small></div></div>
    {recipe.recipeSource&&<p className="recipe-research">{recipe.activeMinutes!==undefined&&<>动手约 {recipe.activeMinutes} 分钟，总耗时 {recipe.time} 分钟。 </>}做法参考 <a href={recipe.recipeSource} target="_blank" rel="noreferrer">{recipe.recipePublisher}</a>。</p>}
    <div className="recipe-context"><span>{recipe.cuisine} · {recipe.category}</span><span>{recipe.tools.join('、')}</span><span>{recipe.tastes.join('、')} · {recipe.seasons.join('、')}</span></div>
    {recipe.tradition && <p className="tradition">{recipe.tradition}</p>}
    {recipe.alcohol && <div className="alcohol-note">含酒精 · 加热后仍有酒精残留。{recipe.alternativeId && <button className="text-button" onClick={()=>onAlternative(recipe.alternativeId!)}>查看无酒精香料热饮</button>}</div>}
    <div className="ingredients-heading"><h3>准备好这些食材</h3><div className="servings-control"><Users size={16}/><button onClick={() => setServings(s => Math.max(1, s - 1))} disabled={servings <= 1} aria-label="减少人数"><Minus size={15}/></button><span aria-live="polite">{servings} 人份</span><button onClick={() => setServings(s => Math.min(8, s + 1))} disabled={servings >= 8} aria-label="增加人数"><Plus size={15}/></button></div></div>
    <div className="ingredients-list">{recipe.ingredients.map(i => <div key={i.name}><span>{i.name}</span><strong>{formatAmount(i.amount)} {i.unit}</strong></div>)}</div>
    {recipe.allergens.length > 0 && <p className="ingredient-note">食材含：{recipe.allergens.join('、')}。购买调味料时也请核对包装配料。</p>}
    <div className="cooking-heading"><h3>跟着做，好吃不慌张</h3><span>{steps.length} / {recipe.steps.length} 步</span></div><div className="step-progress"><span style={{width: steps.length / recipe.steps.length * 100 + '%'}}/></div>
    <ol className="cooking-steps">{recipe.steps.map((step, i) => <li key={i} className={steps.includes(i) ? 'step-done' : ''}><button className="step-check" onClick={() => setSteps(s => s.includes(i) ? s.filter(n => n !== i) : [...s, i])} aria-label={(steps.includes(i) ? '取消完成' : '完成') + '第' + (i + 1) + '步'} aria-pressed={steps.includes(i)}>{steps.includes(i) ? <Check size={18}/> : i + 1}</button><p>{step}</p></li>)}</ol>
    <div className="chef-tip"><ChefHat size={23}/><div><strong>小厨房悄悄话</strong><p>{recipe.tip}</p></div></div>
    <RecipePitfalls recipe={recipe} restricted={restricted}/>
    <p className="muted calorie-note">{recipe.kcalBasis || '热量按整份原料和用油粗估，再按人数均分。实际会随品牌、用量和烹饪方式变化。'}</p>
    <button className="primary-button full-width" onClick={onRecord}><Camera size={19}/>{steps.length === recipe.steps.length ? '做好啦！记录这一餐' : '记录我的这一餐'}</button>
  </div>;
}
