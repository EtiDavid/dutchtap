import type { ReactNode } from 'react';

/** The same top of every screen: a small label, the title, a one-line purpose, and room for one action on the right. */
export function PageHeader({ eyebrow, title, subtitle, action, as: Tag = 'h1' }: { eyebrow?: string; title: string; subtitle?: ReactNode; action?: ReactNode; as?: 'h1' | 'h2' }) {
  return <header className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-1 text-[1.75rem] font-bold leading-tight tracking-tight">{title}</Tag>
      {subtitle && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 pt-1">{action}</div>}
  </header>;
}

/** A titled group on a page, with an optional link-style action. */
export function Section({ title, action, children, label }: { title: string; action?: ReactNode; children: ReactNode; label?: string }) {
  return <section aria-label={label ?? title} className="flex flex-col gap-3">
    <div className="flex items-end justify-between gap-3"><h2 className="eyebrow">{title}</h2>{action}</div>
    {children}
  </section>;
}
