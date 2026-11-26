import assert from 'node:assert/strict'
import {predictCookIssue} from '../../lib/planner/cook-model.ts'
for (const sentence of ['','照片里能看出肉有没有熟吗？','不太好吃','不算成功','没有过咸，也没有烧焦。','不是很满意','肉不柴','担心鸡胸烤焦','要是不成型怎么办？']) {
  const pred=predictCookIssue('准备烤箱',sentence)
  assert.equal(pred.label,null,sentence)
  assert.ok(pred.basis && pred.advice)
}
assert.equal(predictCookIssue('烤箱','烤焦了，有股焦苦味').label,'糊焦')
assert.match(predictCookIssue('烤箱','烤焦了，有股焦苦味').advice,/烤箱|上方热源/)
assert.deepEqual(predictCookIssue('蒸','米粒有硬芯'),predictCookIssue('蒸','米粒有硬芯'))
console.log('12 interface, negation and method-context checks passed')
