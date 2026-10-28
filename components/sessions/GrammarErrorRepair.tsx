"use client";
import {useMemo,useState} from "react";
import rawLessons from "@/data/grammar-topic-lessons.json";
import {analysisFor} from "@/lib/grammarAnalysis";
import {button,primary} from "../flashcards/styles";
type Mistake={wrong:string;right:string;why:string;own?:boolean};
type Lesson={mistakes:Mistake[]};
const lessons=rawLessons as Record<string,Lesson>;
const normal=(s:string)=>s.normalize("NFC").toLocaleLowerCase("nl").replace(/[.,!?;:]/g,"").replace(/\s+/g," ").trim();
/**
 * Optional grammar pattern self-check. Never touches points, mastery, sessions,
 * or claims all grammatical alternatives are machine-validatable.
 */
export function GrammarErrorRepair({topic,cardIds=[]}:{topic:string;cardIds?:string[]}){
 // Mistakes written for the sentences of this session come first, then the topic lesson's general ones.
 const key=`${topic}|${cardIds.join(",")}`;
 const mistakes=useMemo(()=>{
  const own:Mistake[]=[];
  for(const id of cardIds)for(const m of analysisFor(id)?.mistakes??[])own.push({...m,own:true});
  return [...own,...(lessons[topic]?.mistakes??[])];
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 const [state,setState]=useState({key,index:0});
 const index=state.key===key?state.index:0;
 const setIndex=(f:(i:number)=>number)=>setState({key,index:f(index)});
 const [draft,setDraft]=useState("");
 const [checked,setChecked]=useState(false);
 const [showAnswer,setShowAnswer]=useState(false);
 if(!mistakes.length)return null;
 const item=mistakes[index%mistakes.length];
 const exact=normal(draft)===normal(item.right);
 function next(){
  setIndex(i=>(i+1)%mistakes.length);
  setDraft("");setChecked(false);setShowAnswer(false);
 }
 return <details className="card p-4" data-testid="grammar-error-repair">
  <summary className="cursor-pointer text-sm font-bold marker:text-accent">🛠️ Find and fix a grammar mistake</summary>
  <div className="mt-4 space-y-3">
   <p className="text-sm text-muted">Exercise {index+1} of {mistakes.length}{item.own?" · from one of your session sentences":" · from the topic lesson"}. Read the incorrect Dutch sentence and rewrite it naturally. Compare your answer with a reviewed model—other correct Dutch wordings may also exist.</p>
   <p lang="nl" className="rounded-xl bg-surface-2 p-4 text-lg font-semibold" data-testid="wrong-sentence">❌ {item.wrong}</p>
   <form onSubmit={e=>{e.preventDefault();setChecked(true);}} className="space-y-2">
     <label className="block text-sm font-semibold" htmlFor="grammar-repair-answer">Your corrected sentence</label>
     <textarea id="grammar-repair-answer" className="field w-full min-h-24 p-3" lang="nl" rows={2} value={draft} onChange={e=>{setDraft(e.target.value);setChecked(false);}} placeholder="Schrijf de verbeterde zin..." />
     <div className="flex flex-wrap gap-2">
       <button className={primary} type="submit" disabled={!draft.trim()}>Check against model</button>
       <button className={button} type="button" onClick={()=>setShowAnswer(true)}>Show explanation</button>
     </div>
   </form>
   {checked&&<p role="status" className="text-sm" data-testid="grammar-repair-status">{exact?"✅ Your answer matches this model.":"This is different from the stored model. Compare both; a difference does not automatically mean your Dutch is wrong."}</p>}
   {(showAnswer||checked)&&<div className="rounded-xl border border-border bg-surface-2 p-3" data-testid="grammar-repair-explanation">
     <p lang="nl" className="font-semibold">✅ {item.right}</p>
     <p className="mt-2 text-sm leading-relaxed">{item.why}</p>
   </div>}
   <button className={button} type="button" onClick={next}>Next mistake →</button>
   <p className="text-xs text-muted">This optional exercise does not affect your speaking streak or quiz score.</p>
  </div>
 </details>;
}
