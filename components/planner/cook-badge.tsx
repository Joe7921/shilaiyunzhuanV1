'use client';
import {Award} from 'lucide-react';
import {cookStanding,cookLevels} from '@/lib/planner/coach';
import {usePlannerData} from './use-planner-data';
export function CookBadge({userId,loading}:{userId:string|null;loading:boolean}){
 const store=usePlannerData(userId,loading);
 const standing=cookStanding(store.data.cooking[0]);
 return <section className="desk-aside cook-badge"><Award size={26}/><div><h3>我的厨艺徽章</h3>{store.ready?<p><strong>{cookLevels[standing.level-1].name}</strong> · 独立完成 {standing.completed} 道菜</p>:<p>{store.error||'正在打开厨艺记录…'}</p>}<a href="#planner/coach">去厨艺闯关</a></div></section>;
}
