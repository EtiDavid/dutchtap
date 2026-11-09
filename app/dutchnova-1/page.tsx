"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import pack from "@/data/dutchnova-1-cards.json";

type Card = (typeof pack.cards)[number];
type Mode = "study" | "speak" | "quiz";
type Rating = "difficult" | "medium" | "easy" | "mastered";
type SavedState = { ids: string[]; cursor: number; mode: Mode; ratings: Record<string, Rating>; topic: string; setting: string; count: number };
const STORAGE = "dutchtap:dutchnova_1:v1";
const RATINGS: Rating[] = ["difficult", "medium", "easy", "mastered"];
const norm = (s: string) => s.toLocaleLowerCase("nl-BE").normalize("NFKC").replace(/[.,!?;:’'"]/g, "").replace(/\s+/g, " ").trim();

function fresh(): SavedState {
  return { ids: [], cursor: 0, mode: "study", ratings: {}, topic: "all", setting: "all", count: 10 };
}
function weightedPool(items: Card[], ratings: Record<string, Rating>) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  result.sort((a, b) => {
    const priority: Record<Rating, number> = { difficult: 4, medium: 3, easy: 2, mastered: 1 };
    return (priority[ratings[b.id] ?? "difficult"] - priority[ratings[a.id] ?? "difficult"]);
  });
  return result;
}
export default function DutchNovaOne() {
  const [state, setState] = useState<SavedState>(fresh);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        const p = JSON.parse(saved) as SavedState;
        if (Array.isArray(p.ids)) setState({ ...fresh(), ...p, ids: p.ids.filter(id => pack.cards.some(c => c.id === id)) });
      }
    } catch { /* corrupt guest storage: start fresh */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify(state));
  }, [state, ready]);

  const selected = useMemo(() => state.ids.map(id => pack.cards.find(c => c.id === id)).filter((c): c is Card => Boolean(c)), [state.ids]);
  const current = selected[Math.min(state.cursor, Math.max(0, selected.length - 1))];
  const settings = [...new Set(pack.cards.map(c => c.setting))].sort();
  const topics = [...new Set(pack.cards.map(c => c.focus))].sort();
  const matching = pack.cards.filter(c => (state.setting === "all" || c.setting === state.setting) && (state.topic === "all" || c.focus === state.topic));

  const navigate = (cursor: number) => {
    setState(p => ({ ...p, cursor: Math.min(Math.max(cursor, 0), p.ids.length - 1) }));
    setRevealed(false); setHint(false); setAnswer("");
  };
  const chooseMode = (mode: Mode) => {
    setState(p => ({ ...p, mode })); setRevealed(false); setHint(false); setAnswer("");
  };
  const start = () => {
    const ids = weightedPool(matching, state.ratings).slice(0, Math.min(state.count, matching.length)).map(c => c.id);
    setState(p => ({ ...p, ids, cursor: 0, mode: "study" }));
    setRevealed(false); setHint(false); setAnswer("");
  };
  const rate = (rating: Rating) => {
    if (!current) return;
    setState(p => ({ ...p, ratings: { ...p.ratings, [current.id]: rating } }));
    if (state.cursor < selected.length - 1) navigate(state.cursor + 1);
  };
  const matched = current && norm(answer) === norm(current.text);
  const panel = "card p-5";
  return <main className="page-pad mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 pt-6">
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="font-bold text-lg">← DutchTap</Link>
      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">DutchNova_1 · Beta</span>
    </header>
    <section className="card-ink p-6">
      <p className="eyebrow !text-white/70">Conversation mastery</p>
      <h1 className="mt-2 text-3xl font-bold">DutchNova_1</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/85">The grammar you have actually studied, combined in real-life situations. Read → Speak → Quiz. No timer, no automatic pronunciation claims.</p>
      <p className="mt-3 text-xs text-white/70">{pack.cards.length} AI-drafted scenarios · Written answers only; audio is planned after language review.</p>
    </section>
    {!ready ? <p role="status">Loading your session…</p> : <>
      <section className={panel}>
        <h2 className="text-lg font-bold">Choose your practice</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">Setting
            <select aria-label="Setting" className="field mt-1 w-full" value={state.setting} onChange={e => setState(p => ({ ...p, setting: e.target.value }))}>
              <option value="all">All settings</option>{settings.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Grammar focus
            <select aria-label="Grammar focus" className="field mt-1 w-full" value={state.topic} onChange={e => setState(p => ({ ...p, topic: e.target.value }))}>
              <option value="all">Mixed grammar</option>{topics.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Cards
            <select aria-label="Cards in session" className="field mt-1 w-full" value={state.count} onChange={e => setState(p => ({ ...p, count: Number(e.target.value) }))}>
              {[5, 10, 20, 50, 100].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted">{matching.length} cards match these filters.</span>
          <button type="button" className="btn btn-primary" disabled={!matching.length} onClick={start}>Start new session</button>
        </div>
        <p className="mt-2 text-xs text-muted">Starting a new session replaces only the active DutchNova_1 card selection; it does not erase your ratings.</p>
      </section>
      {current && <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold">Card {state.cursor + 1} of {selected.length} · {current.setting}</span>
          <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs">{current.focus}</span>
        </div>
        <progress aria-label="Session progress" value={state.cursor + 1} max={selected.length} className="flash-progress mt-3 h-2 w-full" />
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Practice mode">
          {(["study", "speak", "quiz"] as Mode[]).map(mode =>
            <button type="button" key={mode} className={`btn ${state.mode === mode ? "btn-primary" : ""}`} aria-pressed={state.mode === mode} onClick={() => chooseMode(mode)}>{mode === "study" ? "📖 Study" : mode === "speak" ? "🗣️ Speak" : "🎯 Quiz"}</button>
          )}
        </div>
        <div className="mt-5 rounded-xl bg-surface-2 p-5">
          <p className="eyebrow">{state.mode === "study" ? "Read and understand" : state.mode === "speak" ? "Say it in Dutch before revealing" : "Write a Dutch response"}</p>
          <p className="mt-3 text-base leading-relaxed">{current.scenarioEn}</p>
          {state.mode !== "study" && <button type="button" onClick={() => setHint(v => !v)} className="mt-3 text-sm font-semibold text-accent underline">{hint ? "Hide grammar hint" : "Show grammar hint"}</button>}
          {hint && state.mode !== "study" && <p className="mt-2 text-sm">Focus: {current.focus}</p>}
          {state.mode === "quiz" && <>
            <label className="mt-4 block text-sm font-semibold" htmlFor="dutchnova-answer">Your Dutch sentence</label>
            <textarea id="dutchnova-answer" className="field mt-1 min-h-24 w-full" autoComplete="off" spellCheck={false} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write what you would say…" />
            {answer.trim() && <p className="text-xs text-muted">{matched ? "Matches the stored model exactly." : "Not an exact match to this stored model. Other natural Dutch answers may be valid."}</p>}
          </>}
          {state.mode === "study" || revealed ? <>
            <p className="mt-5 border-t border-border pt-4 text-xl font-bold" lang="nl-BE">{current.text}</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              <p><strong>Why it works:</strong> {current.explanation}</p>
              <p><strong>Common learner mistake:</strong> <span lang="nl-BE">{current.commonMistake}</span></p>
              <p><strong>Contrast:</strong> {current.contrast}</p>
              <p className="text-xs text-muted">AI-drafted, not independently native-reviewed. Audio not generated.</p>
            </div>
          </> : <button type="button" className="btn btn-primary mt-5" onClick={() => setRevealed(true)}>Reveal Dutch + explanation</button>}
        </div>
        {(state.mode === "study" || revealed) && <div className="mt-5">
          <p className="text-sm font-semibold">How confidently could you say this without looking?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map(r => <button type="button" key={r} className={`btn capitalize ${state.ratings[current.id] === r ? "border-accent" : ""}`} onClick={() => rate(r)}>{r}</button>)}
          </div>
        </div>}
        <nav className="mt-5 flex items-center justify-between">
          <button type="button" className="btn" disabled={state.cursor === 0} onClick={() => navigate(state.cursor - 1)}>← Previous</button>
          <button type="button" className="btn btn-primary" disabled={state.cursor === selected.length - 1} onClick={() => navigate(state.cursor + 1)}>Next →</button>
        </nav>
      </section>}
      {!current && <section className={panel}><p>Select a setting and start a session to begin practising.</p></section>}
      <footer className="text-xs leading-relaxed text-muted">Guest-mode progress is stored only in this browser. This pilot section is separate from existing DutchTap sessions and account sync. It does not evaluate speech or pronunciation.</footer>
    </>}
  </main>;
}
