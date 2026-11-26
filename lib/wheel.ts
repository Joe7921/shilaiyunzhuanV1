import type {Recipe} from './recipes';
export const TABLE_SIZE=12;
export function arrangeWheel(pool:Recipe[],random=Math.random) {
  const remaining=[...pool];
  for(let i=remaining.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
  }
  const tables:Recipe[][]=[];
  while(remaining.length) {
    const table:Recipe[]=[], cuisines=new Set<string>(), ingredients=new Set<string>();
    while(table.length<TABLE_SIZE && remaining.length) {
      let i=remaining.findIndex(r=>!cuisines.has(r.cuisine)&&!ingredients.has(r.luckyIngredient));
      if(i<0) i=remaining.findIndex(r=>!ingredients.has(r.luckyIngredient));
      const [r]=remaining.splice(Math.max(i,0),1);
      table.push(r);cuisines.add(r.cuisine);ingredients.add(r.luckyIngredient);
    }
    tables.push(table);
  }
  if(tables.length>1 && tables.at(-1)!.length< TABLE_SIZE) {
    const last=tables.at(-1)!;
    last.push(...tables[0].slice(0,TABLE_SIZE-last.length));
  }
  return tables;
}

