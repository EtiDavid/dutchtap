"use client";
import { useState } from "react";
import Link from "next/link";
import { WORK_AREAS } from "@/lib/content/collections";
import { CATEGORIES } from "@/lib/flashcards/engine";
import { AppNav } from "../nav/AppNav";
import { Icon } from "../ui/Icon";
import { PageHeader, Section } from "../ui/PageHeader";
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
    "mt-2 w-full field";
  const all = vocabularyFor(lang);

  return (
    <main
      className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6"
      data-lang={lang}
    >
      <PageHeader
        eyebrow="Words"
        title="Vocabulary"
        subtitle={<>Useful {LANG_INFO[lang].english} words and expressions from your sentence cards.</>}
        action={<LanguageSwitch lang={lang} onSwitch={onSwitchLanguage} />}
      />
      {cardId && (
        <BackButton fallback={withLang(DASHBOARD_URL, lang)}>Back to where you were</BackButton>
      )}
      {lang === "nl" && !cardId && (
        <Section title="Quick grammar games" label="Quick grammar games">
          <div className="grid grid-cols-3 gap-3">
            {([["De or Het", "/game/article", "de · het"], ["Deze · Dit · Die · Dat", "/game/demonstrative", "dit · die"], ["Adjective Ending", "/game/adjective", "-e · –"]] as const).map(([title, href, hint]) => (
              <Link key={href} href={href} className="card tap tap-hover flex flex-col gap-2 p-3.5">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name="spark" className="h-[1.125rem] w-[1.125rem]" /></span>
                <span className="text-[0.8125rem] font-semibold leading-snug">{title}</span>
                <span className="font-mono text-xs text-accent">{hint}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}
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
            className="scroll-mt-6 card p-5"
          >
            <h2 lang={lang} className="text-xl font-bold">
              {entry.article ? `${entry.article} ` : ""}
              {entry.headword}
            </h2>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn !min-h-10 !px-3"
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
                className="btn !min-h-10 !px-3"
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
