"use client";
import Link from "next/link";
import { AppNav } from "../nav/AppNav";
import { BackButton } from "../nav/BackButton";
import { PageHeader } from "../ui/PageHeader";
import { GrammarNotes } from "../flashcards/GrammarNotes";
import { GrammarTopicsHere } from "./GrammarTopicsHere";
import { LanguageGate } from "../lang/LanguageGate";
import { LanguageSwitch } from "../lang/LanguageSwitch";
import { AnswerModels } from "./AnswerModels";
import { CardImage, AudioControls } from "./CardParts";
import { useCardAudio } from "@/lib/flashcards/useCardAudio";
import { cardFor } from "@/lib/content/cards";
import { wordsForCard } from "@/lib/vocabulary";
import { withLang, type Lang } from "@/lib/lang";

/** A read-only sentence page in one language. Shared links name the language (?lang=fr); Dutch links stay as they always were. */
export function SentenceView({ id }: { id: string }) {
  return (
    <LanguageGate>
      {(lang, choose) => (
        <Sentence key={lang} id={id} lang={lang} onSwitchLanguage={choose} />
      )}
    </LanguageGate>
  );
}

function Sentence({
  id,
  lang,
  onSwitchLanguage,
}: {
  id: string;
  lang: Lang;
  onSwitchLanguage: (lang: Lang) => void;
}) {
  const { sound, listen, stop } = useCardAudio();
  const card = cardFor(lang, id);
  const words = wordsForCard(id, lang);
  return (
    <main
      className="page-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 pt-6"
      data-lang={lang}
    >
      <BackButton fallback={withLang("/vocabulary", lang)}>Back</BackButton>
      <PageHeader
        eyebrow="Sentence"
        title="Sentence example"
        action={<LanguageSwitch lang={lang} onSwitch={onSwitchLanguage} />}
        subtitle={<Link href={withLang("/flashcards", lang)} className="font-semibold text-accent">Continue flashcards →</Link>}
      />
      {!card ? (
        <p
          role="status"
          data-testid="sentence-unavailable"
          className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted"
        >
          This sentence is not available in {lang === "fr" ? "French" : "Dutch"}
          .{" "}
          <Link
            href={withLang("/flashcards", lang === "fr" ? "nl" : "fr")}
            className="text-accent underline"
          >
            Try the other language
          </Link>
        </p>
      ) : (
        <article className="card overflow-hidden !rounded-[1.75rem]">
          <CardImage card={card} alt={card.cue} />
          <div className="p-6">
            <p lang={lang} className="text-2xl font-semibold">
              {card.text}
            </p>
            <p className="mt-3 text-muted">{card.english}</p>
            <AudioControls
              card={card}
              sound={sound}
              listen={listen}
              stop={stop}
            />
            <AnswerModels card={card} />
            <GrammarNotes
              cardId={card.id}
              lang={lang}
              variation={card.variation}
              defaultOpen
            />
            {lang === "nl" && <GrammarTopicsHere card={card} />}
          </div>
        </article>
      )}
      <div className="flex flex-wrap gap-3">
        {words.map((word) => (
          <Link
            key={word.id}
            href={withLang(`/vocabulary#${word.id}`, lang)}
            lang={lang}
            className="text-accent underline"
          >
            {word.headword}
          </Link>
        ))}
      </div>
      <AppNav lang={lang} />
    </main>
  );
}
