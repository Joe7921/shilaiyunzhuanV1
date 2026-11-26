'use client';
import {useEffect, useRef, useState} from 'react';
import {BookOpen, Check, Flame, Flower2, Leaf, RefreshCw, Soup, Star, Zap} from 'lucide-react';
import {FoodImage} from './ui';
import type {Recipe} from '@/lib/recipes';
import {guideUrl, quizQuestions, tasteQuestionCount, tasteReport, validQuizAnswers} from '@/lib/personality';

function previousReport(key:string, personality:string|null):number[]|null {
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(saved?.personality===personality && validQuizAnswers(saved.answers))return saved.answers;
  } catch { /* The questionnaire also works without device storage. */ }
  return null;
}

export default function PersonalityTool({onResult,onOpen,candidates,identity,personality}:{
  onResult:(id:string)=>void; onOpen:(recipe:Recipe)=>void; candidates:Recipe[]; identity:string; personality:string|null;
}) {
  const key='sl-taste-report-v1-'+identity;
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState<number[]>([]);
  const [complete,setComplete]=useState<number[]|null>(()=>previousReport(key,personality));
  const [saveNotice,setSaveNotice]=useState('');
  const heading=useRef<HTMLHeadingElement>(null);
  const legend=useRef<HTMLLegendElement>(null);
  useEffect(()=>{
    const target=complete?heading.current:legend.current;
    target?.focus({preventScroll:true});
    target?.scrollIntoView({block:'nearest'});
  },[step,complete]);
  const q=quizQuestions[step];
  const result=complete?tasteReport(complete,candidates):null;
  function next(){
    if(answers[step]===undefined)return;
    if(step<quizQuestions.length-1){setStep(step+1);return}
    const done=tasteReport(answers,[]);
    if(!done)return;
    setComplete([...answers]);
    onResult(done.personality.id);
    try {localStorage.setItem(key,JSON.stringify({personality:done.personality.id,answers}));}
    catch {setSaveNotice('这台设备暂时无法保存详细报告，本次结果仍可查看。');}
  }
  if(result){
    const {personality:kind,summary,foodStyle,tips,recommendations}=result;
    const Badge={cozy:Soup,bold:Flame,fresh:Leaf,quick:Zap}[kind.id];
    return <div className="personality-result taste-report">
      <div className="personality-badge" aria-hidden="true"><Badge size={44}/></div>
      <p className="muted">你的美食人格是</p><h3 tabIndex={-1} ref={heading}>{kind.title}</h3>
      <section className="taste-chapter"><h4><Flower2 size={19}/>你可能爱吃什么</h4><p>{summary}</p><p>{foodStyle}</p></section>
      <section className="taste-chapter"><h4><BookOpen size={19}/>按你的口味，试试这几道</h4>
        {recommendations.length?recommendations.map(({r,reason})=><button className="personality-recipe" key={r.id} onClick={()=>onOpen(r)}>
          <FoodImage recipe={r}/><span><strong>{r.title}</strong><small>{r.time} 分钟 · {r.difficulty}</small>
          {reason&&<small>合你口味的地方：{reason}</small>}</span><BookOpen size={17}/></button>):
          <p>按当前忌口和用时筛选，暂时没有合适的口味推荐。</p>}
      </section>
      <section className="taste-chapter balance-notes"><h4><Leaf size={19}/>日常怎么搭得更均衡</h4>
        <ul>{tips.map(t=><li key={t.label}><strong>你选了「{t.label}」</strong><p>{t.tip}</p></li>)}</ul>
        <a href={guideUrl} target="_blank" rel="noreferrer">参考《中国居民膳食指南（2022）》</a>
      </section>
      <p className="muted personality-note">口味画像来自这次答题。搭配建议供一般日常饮食参考。{saveNotice}</p>
      <button className="secondary-button" onClick={()=>{setAnswers([]);setComplete(null);setStep(0);setSaveNotice('')}}><RefreshCw size={16}/>重新测一测</button>
    </div>;
  }
  return <div className="personality-tool">
    <div className="quiz-progress-label" aria-live="polite"><span><Star size={16}/>{step<tasteQuestionCount?'你的口味偏好':'日常吃饭习惯'}</span><span>{step+1} / {quizQuestions.length}</span></div>
    <progress className="quiz-progress" value={step+1} max={quizQuestions.length} aria-label={`第 ${step+1} 题，共 ${quizQuestions.length} 题`}/>
    <fieldset className="quiz-question"><legend ref={legend} tabIndex={-1}>{q.question}</legend><div className="quiz-options">
    {q.options.map((o,i)=><label key={o.label} className={'quiz-option'+(answers[step]===i?' is-selected':'')}>
      <input type="radio" name={'taste-question-'+step} checked={answers[step]===i} onChange={()=>setAnswers(prev=>{const n=[...prev];n[step]=i;return n})}/>
      <span className="quiz-option-letter" aria-hidden="true">{String.fromCharCode(65+i)}</span><span>{o.label}</span>{answers[step]===i&&<Check size={18}/>}
    </label>)}</div></fieldset>
    <div className="quiz-actions"><button className="text-button" disabled={step===0} onClick={()=>setStep(step-1)}>上一题</button>
    <button className="primary-button" onClick={next} disabled={answers[step]===undefined}>{step===quizQuestions.length-1?'看看我的美食人格':'下一题'}</button></div>
  </div>;
}
