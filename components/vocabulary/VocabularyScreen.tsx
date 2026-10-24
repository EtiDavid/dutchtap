"use client";
import { useState } from "react";
import Link from "next/link";
import { WORK_AREAS } from "@/lib/content/collections";
import { CATEGORIES } from "@/lib/flashcards/engine";
import { AppNav } from "../nav/AppNav";
import { BackButton } from "../nav/BackButton";
import { LanguageGate } from "../lang/LanguageGate";
import { LanguageSwitch } from "../lang/LanguageSwitch";
import {
  filterVocabulary,
  vocabularyExamples,
  vocabularyFor,
  vocabularyLessons,
  type FrenchVocabularyEntry,
} from "@/lib/vocabulary";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { copy } from "@/lib/lang/copy";
import { LANG_INFO, withLang, type Lang } from "@/lib/lang";
import { DASHBOARD_URL } from "@/lib/sessions/nav";

export function VocabularyScreen({ cardId = "" }: { cardId?: string }) {
  return (
    <LanguageGate>
      {(lang, choose) => (
        <VocabularyView
          key={lang}
          lang={lang}
          cardId={cardId}
          onSwitchLanguage={choose}
        />
      )}
    </LanguageGate>
  );
}

function VocabularyView({
  lang,
  cardId,
  onSwitchLanguage,
}: {
  lang: Lang;
  cardId: string;
  onSwitchLanguage: (lang: Lang) => void;
}) {
  const { listen, stop, sound } = useCardAudio();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const entries = filterVocabulary(query, category, type, cardId, lang);
  const field =
    "mt-2 w-full rounded-xl border border-border bg-white p-3 text-base";
  const all = vocabularyFor(lang);

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pb-28 pt-6"
      data-lang={lang}
    >
      <header className="flex items-center justify-between gap-3 text-sm">
        <BackButton fallback={withLang(DASHBOARD_URL, lang)}>
          {cardId ? "Back to where you were" : "Back"}
        </BackButton>
        <LanguageSwitch lang={lang} onSwitch={onSwitchLanguage} />
      </header>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
        <p className="mt-2 text-muted">
          Useful {LANG_INFO[lang].english} words and expressions from your
          sentence cards.
        </p>
      </div>
      {cardId && (
        <p className="text-sm text-muted">
          Words from this sentence.{" "}
          <Link
            href={withLang("/vocabulary", lang)}
            className="text-accent underline"
          >
            Browse all words
          </Link>
        </p>
      )}
      <label className="text-sm font-semibold">
        Search words
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy(lang).searchPlaceholder}
          className={field}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">
          Place
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={field}
          >
            <option value="all">All places</option>
            {Object.entries(CATEGORIES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
            {lang === "nl" && (
              <optgroup label="Dutch at Work">
                {Object.entries(WORK_AREAS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Word type
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={field}
          >
            <option value="all">All types</option>
            {[...new Set(all.map((entry) => entry.type))].map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="text-sm text-muted">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
      </p>
      {sound && (
        <p role="status" className="text-sm text-muted">
          {sound}
        </p>
      )}
      {!entries.length && (
        <p>No matching words. Try another search or filter.</p>
      )}
      {entries.map((entry) => {
        const examples = vocabularyExamples(entry, lang);
        const first = examples[0];
        const gender = (entry as FrenchVocabularyEntry).gender;
        return (
          <article
            key={entry.id}
            id={entry.id}
            className="scroll-mt-6 rounded-2xl border border-border bg-surface p-5"
          >
            <h2 lang={lang} className="text-xl font-bold">
              {entry.article ? `${entry.article} ` : ""}
              {entry.headword}
            </h2>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="min-h-10 rounded-xl border border-border px-3 text-sm"
                onClick={() =>
                  void listen({
                    text: `${entry.article ? `${entry.article} ` : ""}${entry.headword}`,
                    lang,
                  })
                }
              >
                Listen to word
              </button>
              <button
                type="button"
                className="min-h-10 rounded-xl border border-border px-3 text-sm"
                onClick={stop}
              >
                Stop
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {entry.type}
              {gender ? ` · ${gender === "m" ? "masculine" : "feminine"}` : ""}
              {entry.plural ? ` · plural: ${entry.plural}` : ""}
            </p>
            <p className="mt-3 font-medium">{entry.english}</p>
            <p lang={lang} className="mt-2 leading-relaxed">
              {entry.explanation}
            </p>
            {entry.details && (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {entry.details}
              </p>
            )}
            {entry.learningDetails && (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {entry.learningDetails}
              </p>
            )}
            {first && (
              <div className="mt-4 border-t border-border pt-3">
                <p lang={lang} className="font-medium">
                  {first.card.text}
                </p>
                <p className="mt-1 text-sm text-muted">{first.card.english}</p>
                <p className="mt-2 text-xs text-muted">
                  Form in this example:{" "}
                  <span lang={lang} className="font-semibold">
                    {first.form}
                  </span>
                </p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {examples.map(({ card }) => (
                <Link
                  key={card.id}
                  href={withLang(`/sentences/${card.id}`, lang)}
                  className="text-sm text-accent underline"
                >
                  View sentence: {card.id}
                </Link>
              ))}
            </div>
            {lang === "nl" && vocabularyLessons(entry).length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Examples from grammar practice
                </summary>
                {vocabularyLessons(entry)
                  .slice(0, 6)
                  .map((task) => (
                    <div key={task.id} className="mt-3">
                      <p lang="nl">{task.answers[0]}</p>
                      <p className="text-sm text-muted">{task.english}</p>
                      <Link
                        href={`/learn?topic=${task.topic}`}
                        className="text-sm text-accent underline"
                      >
                        Practise this pattern
                      </Link>
                    </div>
                  ))}
              </details>
            )}
          </article>
        );
      })}
      <AppNav lang={lang} />
    </main>
  );
}
