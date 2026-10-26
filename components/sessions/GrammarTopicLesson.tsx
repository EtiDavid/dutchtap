"use client";
import rawLessons from "@/data/grammar-topic-lessons.json";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { button } from "../flashcards/styles";
type Example = {nl:string;en:string};
type Lesson = {title:string;goal:string;overview:string;status:string;revision:string;formulas:{label:string;pattern:string;why:string}[];sections:{title:string;body:string;examples:Example[]}[];mistakes:{wrong:string;right:string;why:string}[];sources:string[][]};
const lessons = rawLessons as Record<string,Lesson>;
/** Topic-wide teaching remains independent from a session's current question and answer. */
export function GrammarTopicLesson({topic, defaultOpen = false}: {topic:string; defaultOpen?: boolean}) {
  const lesson = lessons[topic];
  const {listen,stop,sound} = useCardAudio();
  if (!lesson) return null;
  return <details defaultOpen={defaultOpen} className="card group overflow-hidden p-4" data-testid="grammar-topic-lesson" data-topic={topic}>
    <summary className="cursor-pointer text-sm font-bold leading-relaxed text-foreground marker:text-accent">
      📖 Learn the rule · {lesson.title}
      <span className="mt-1 block text-xs font-normal text-muted">Tap to expand the complete topic guide; close it when speaking.</span>
    </summary>
    <div className="mt-4 space-y-5 border-t border-border pt-4">
      <div className="rounded-xl bg-accent-soft p-4"><p className="font-bold">Your goal</p><p className="mt-2 text-sm leading-relaxed">{lesson.goal}</p><p className="mt-2 text-sm leading-relaxed">{lesson.overview}</p></div>
      <section aria-label="Word order formulas" className="space-y-3">
        <h3 className="font-bold">Sentence formulas · why before how</h3>
        {lesson.formulas.map(x=><div key={x.label} className="rounded-xl border border-border bg-surface-2 p-3">
          <h4 className="text-sm font-semibold">{x.label}</h4><p lang="nl" className="mt-2 break-words text-base font-bold text-accent">{x.pattern}</p><p className="mt-2 text-sm leading-relaxed">{x.why}</p>
        </div>)}
      </section>
      {lesson.sections.map(s=><section key={s.title} className="space-y-2 border-t border-border pt-4">
        <h3 className="font-bold">{s.title}</h3><p className="text-sm leading-relaxed">{s.body}</p>
        <ul className="space-y-2">{s.examples.map(e=><li key={e.nl} className="flex items-start justify-between gap-2 rounded-xl bg-surface-2 p-3"><div><p lang="nl" className="text-sm font-semibold">{e.nl}</p><p className="mt-1 text-xs text-muted">{e.en}</p></div><button className={button + " !min-h-10 shrink-0 !px-3"} type="button" aria-label={"Listen to "+e.nl} onClick={()=>void listen({text:e.nl,lang:"nl"})}>🔊</button></li>)}</ul>
      </section>)}
      <section className="space-y-2 border-t border-border pt-4" aria-label="Common mistakes"><h3 className="font-bold">Common mistakes: wrong → right → why</h3>
        {lesson.mistakes.map(x=><div key={x.wrong} className="rounded-xl bg-surface-2 p-3 text-sm"><p lang="nl"><span aria-label="Incorrect">❌</span> <span className="line-through">{x.wrong}</span></p><p lang="nl" className="mt-1 font-semibold">✅ {x.right}</p><p className="mt-2 text-muted">{x.why}</p></div>)}
      </section>
      {lesson.sources.length>0 && <section className="border-t border-border pt-4"><h3 className="font-bold">References</h3><ul className="mt-2 space-y-1">{lesson.sources.map(s=><li key={s[1]}><a className="text-sm text-accent underline" href={s[1]} target="_blank" rel="noopener noreferrer">{s[0]}</a></li>)}</ul></section>}
      <p className="border-t border-border pt-3 text-xs text-muted">Lesson v{lesson.revision} · {lesson.status}. Example audio uses the Dutch device voice.</p>
      {sound && <p role="status" className="text-xs text-muted">{sound}</p>}
      <button className={button} type="button" onClick={stop}>Stop audio</button>
    </div>
  </details>;
}
