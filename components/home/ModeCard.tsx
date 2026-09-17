import Link from "next/link";

export function ModeCard({
  href,
  title,
  subtitle,
  example,
}: {
  href: string;
  title: string;
  subtitle: string;
  example: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-surface px-5 py-4 transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="text-lg font-semibold text-foreground">{title}</span>
      <span className="text-sm text-muted">{subtitle}</span>
      <span className="mt-1 font-mono text-sm text-accent">{example}</span>
    </Link>
  );
}
