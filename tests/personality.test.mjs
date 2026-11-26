import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from './lib/personality';export {recipes} from './lib/recipes';export {defaultPrefs,matchesPrefs} from './lib/client';export {isDessert} from './lib/blindbox';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {quizQuestions,tasteQuestionCount,tasteReport,validQuizAnswers,recipes,defaultPrefs,matchesPrefs,isDessert}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const profileAnswers=kind=>quizQuestions.map((q,i)=>i<tasteQuestionCount?q.options.findIndex(o=>o.kind===kind):0);
test('twelve distinct questions and all four existing taste identities can be reached and reproduced',()=>{
  assert.equal(new Set(quizQuestions.map(q=>q.question)).size,12);
  for(const id of ['bold','fresh','cozy','quick']){
    const answers=profileAnswers(id);
    const result=tasteReport(answers,recipes);
    assert.equal(result.personality.id,id);
    assert.deepEqual(result,tasteReport(answers,recipes));
    assert.ok(result.summary.includes(quizQuestions[0].options[answers[0]].preference));
    assert.ok(result.summary.includes(quizQuestions[1].options[answers[1]].preference));
    assert.equal(result.recommendations.length,3);
  }
  for(const input of [null,[],[0,1],Array(12).fill(9),Array(12).fill('1'),new Array(12)]){
    assert.equal(validQuizAnswers(input),false);
  }
});
test('balanced meal tips follow the five reported habits independently of taste identity',()=>{
  const answers=profileAnswers('bold'), other=[...answers.slice(0,7),2,2,3,1,0];
  const a=tasteReport(answers,recipes),b=tasteReport(other,recipes);
  assert.equal(b.personality.id,a.personality.id);assert.equal(b.summary,a.summary);
  assert.notDeepEqual(b.tips,a.tips);assert.equal(b.tips.length,3);
  assert(b.tips.every(t=>other.slice(7).some((option,i)=>quizQuestions[7+i].options[option].label===t.label)));
  assert(b.tips.some(t=>t.label.includes('顾不上蔬菜')));
  const textureChange=[...answers];textureChange[1]=2;
  assert.notEqual(tasteReport(textureChange,recipes).summary,a.summary);
});
test('all suggested foods come from the allowed pool, with explanations and safe empty results',()=>{
  const answers=profileAnswers('quick');answers[5]=3;
  const prefs={...defaultPrefs,excluded:['奶','花生','蛋'],avoid:['黄瓜'],vegetarian:true};
  const eligible=recipes.filter(r=>matchesPrefs(r,prefs)),result=tasteReport(answers,eligible);
  assert(result.recommendations.length>0);
  for(const {r,reason} of result.recommendations){
    assert(eligible.includes(r)&&!r.alcohol&&!isDessert(r));assert(reason.length>0);assert(r.steps.length>0);
  }
  assert.deepEqual(tasteReport(answers,[]).recommendations,[]);
  assert.equal(tasteReport(answers.slice(0,5),eligible),null);
});
