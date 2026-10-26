"use client";
import { useState } from "react";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { button } from "../flashcards/styles";
/**
 * Dutch-first prompt for authored grammar situations.
 * The answer is never displayed by this component.
 * Cards awaiting a Dutch editorial prompt explicitly fall back to English.
 */
export function GrammarScenarioPrompt({scenario, scenarioNl}: {scenario:string;scenarioNl?:string}) {
  const [showEnglish,setShowEnglish]=useState(false);
  const {listen,stop,sound}=useCardAudio();
  const dutch=typeof scenarioNl==="string" && scenarioNl.trim().length>0;
  const spoken=dutch&&!showEnglish?scenarioNl!:scenario;
  const language=dutch&&!showEnglish?"nl":"en";
  return <section data-testid="grammar-scenario-prompt" className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{dutch?"Think in Dutch · situation":"Situation · Dutch prompt not yet available"}</p>
    <p lang={language} className="text-lg leading-relaxed">{spoken}</p>
    {dutch && <button type="button" className={button} onClick={()=>{stop();setShowEnglish(!showEnglish);}} aria-pressed={showEnglish}>{showEnglish?"Hide English help":"Show English help"}</button>}
    <button type="button" className={button} onClick={()=>void listen({text:spoken,lang:language})}>🔊 Listen to situation ({language==="nl"?"Dutch":"English"})</button>
    <button type="button" className={button} onClick={stop}>Stop</button>
    {sound && <p role="status" className="text-xs text-muted">{sound}</p>}
    <p className="text-xs text-muted">Say your own Dutch answer before revealing the model. Speaking is self-rated: audio playback does not grade pronunciation.</p>
  </section>;
}
