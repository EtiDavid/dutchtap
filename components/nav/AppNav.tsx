"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SESSIONS_CHANGED, SUMMARY_KEY } from "@/lib/sessions/store";
import { DEFAULT_LANG, withLang, type Lang } from "@/lib/lang";
import { useSavedLanguage } from "@/lib/lang/useLanguage";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Four places, each with one job: Today (where to go next), Practise (your sessions and skill labs),
 * Words (vocabulary and quick games) and Progress (levels, streak, stats and your account).
 * `match` lists the routes that belong to a tab, so the right one is highlighted on every page.
 */
const TABS: readonly { href: string; label: string; icon: IconName; match: readonly string[]; session?: boolean }[] = [
  { href: "/", label: "Today", icon: "today", match: [] },
  { href: "/flashcards", label: "Practise", icon: "practise", match: ["/flashcards", "/quiz", "/learn", "/sentences", "/grammar"], session: true },
  { href: "/vocabulary", label: "Words", icon: "words", match: ["/vocabulary", "/game"] },
  { href: "/stats", label: "Progress", icon: "progress", match: ["/stats", "/account"] },
];

function hasActiveSessions(): boolean {
  try {
    return (JSON.parse(localStorage.getItem(SUMMARY_KEY) || "null")?.active ?? 0) > 0;
  } catch {
    return false;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(SESSIONS_CHANGED, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(SESSIONS_CHANGED, listener);
  };
}

/** Bottom tab bar shared by every page. A dot on Practise means a session is waiting; opening it resumes exactly where the learner left off. */
export function AppNav({ lang }: { lang?: Lang } = {}) {
  const pathname = usePathname();
  // The page's own language when it has one (a session), otherwise the saved choice. Dutch links stay exactly as they were.
  const saved = useSavedLanguage().lang;
  const effective = lang ?? saved ?? DEFAULT_LANG;
  const waiting = useSyncExternalStore(subscribe, hasActiveSessions, () => false);

  const isActive = (tab: (typeof TABS)[number]) =>
    tab.href === "/" ? pathname === "/" : tab.match.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const resumable = !!tab.session && waiting && !active;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href === "/" ? tab.href : withLang(tab.href, effective)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[0.6875rem] font-semibold tracking-wide focus-visible:outline-2 focus-visible:outline-accent ${active ? "text-accent" : "text-muted hover:text-foreground"}`}
              >
                <span className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-accent-soft" : ""}`}>
                  <Icon name={tab.icon} className="h-[1.375rem] w-[1.375rem]" />
                  {resumable && <><span aria-hidden className="absolute right-2 top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" /><span className="sr-only">session in progress</span></>}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
