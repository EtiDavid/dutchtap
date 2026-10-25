import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

/** One destination: an icon, what it is, one line on what you do there, and a real example so it is never abstract. */
export function ModeCard({ href, title, subtitle, example, icon = "spark" }: { href: string; title: string; subtitle: string; example?: string; icon?: IconName }) {
  return (
    <Link href={href} className="card tap tap-hover group flex w-full items-center gap-4 px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name={icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-foreground">{title}</span>
        <span className="block text-sm leading-snug text-muted">{subtitle}</span>
        {example && <span className="mt-1.5 block truncate font-mono text-xs text-accent">{example}</span>}
      </span>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** A compact square destination for groups of related activities (labs, games). */
export function Tile({ href, title, hint, icon = "spark" }: { href: string; title: string; hint?: string; icon?: IconName }) {
  return (
    <Link href={href} className="card tap tap-hover flex min-h-[7.25rem] flex-col justify-between gap-3 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name={icon} className="h-5 w-5" /></span>
      <span>
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        {hint && <span className="mt-0.5 block truncate font-mono text-xs text-accent">{hint}</span>}
      </span>
    </Link>
  );
}
