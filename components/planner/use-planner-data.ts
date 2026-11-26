'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Stock,Expense,BudgetCycle} from '@/lib/planner/local';
import type {CookProgress} from '@/lib/planner/coach';
type Data={pantry:Stock[];expenses:Expense[];budgets:BudgetCycle[];cooking:CookProgress[]};
type Key=keyof Data;
const empty:Data={pantry:[],expenses:[],budgets:[],cooking:[]};
export function usePlannerData(userId:string|null,profileLoading:boolean) {
  const [data,setData]=useState<Data>(empty),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
  const rev=useRef<Record<Key,number>>({pantry:0,expenses:0,budgets:0,cooking:0});const saving=useRef(false);
  useEffect(()=>{
    if(profileLoading)return;const abort=new AbortController();setReady(false);setError('');setData(empty);
    async function read(){
      if(!userId){
        try{const raw=JSON.parse(localStorage.getItem('sl-desk-guest')||'{}');setData({pantry:raw.pantry||[],expenses:raw.expenses||[],budgets:raw.budgets||[],cooking:raw.cooking||[]})}catch{}
        setReady(true);return;
      }
      try{
        const r=await fetch('/api/planner',{signal:abort.signal});
        if(!r.ok)throw Error('暂时未能读取你的厨房资料。');
        const {sections}=await r.json() as {sections:{[K in Key]?:{value:Data[K];revision:number}}};
        if(abort.signal.aborted)return;
        rev.current={pantry:sections.pantry?.revision||0,expenses:sections.expenses?.revision||0,budgets:sections.budgets?.revision||0,cooking:sections.cooking?.revision||0};
        setData({pantry:sections.pantry?.value||[],expenses:sections.expenses?.value||[],budgets:sections.budgets?.value||[],cooking:sections.cooking?.value||[]});setReady(true);
      }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'读取失败')}
    }
    void read();return ()=>abort.abort();
  },[userId,profileLoading,reload]);
  async function save<K extends Key>(section:K,value:Data[K]){
    if(saving.current||!ready)return false;
    setError('');saving.current=true;setBusy(true);
    try{
      if(userId){
        const r=await fetch('/api/planner',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({section,value,revision:rev.current[section]})});
        if(r.status===409){setReload(n=>n+1);throw Error('另一台设备已更新这份资料。请看最新内容后再保存。')}
        const result=await r.json() as {error?:string;revision:number};if(!r.ok)throw Error(result.error||'保存失败');rev.current[section]=result.revision;
      }else{localStorage.setItem('sl-desk-guest',JSON.stringify({...data,[section]:value}))}
      setData(prev=>({...prev,[section]:value}));return true;
    }catch(e){setError(e instanceof Error?e.message:'保存失败');return false}
    finally{saving.current=false;setBusy(false)}
  }
  return {data,save,ready,busy,error,reload:useCallback(()=>setReload(n=>n+1),[])};
}
export type PlannerStore=ReturnType<typeof usePlannerData>;
