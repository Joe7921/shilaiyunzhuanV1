import { readFile } from 'node:fs/promises'
import { predictCookIssue } from '../../lib/planner/cook-model.ts'
const file=process.argv[2] || 'holdout.tsv'
const rows=(await readFile(new URL(file,import.meta.url),'utf8')).trim().split('\n')
const counts={}
const errors=[]
for(const row of rows) {
  const [expected,outcome]=row.split('\t')
  const {label}=predictCookIssue('普通家庭烹饪',outcome)
  const actual=label??'拒判'
  const count=counts[expected]??={correct:0,total:0}
  count.total++
  if(actual===expected) count.correct++
  else errors.push({expected,actual,outcome})
}
console.log(JSON.stringify({set:file,total:rows.length,correct:rows.length-errors.length,counts,errors},null,2))
