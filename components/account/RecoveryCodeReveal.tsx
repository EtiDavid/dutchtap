"use client";

import { useState } from "react";

export function RecoveryCodeReveal({ code, onContinue }: { code: string; onContinue: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; the code is still visible to copy by hand.
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div>
        <p className="text-lg font-semibold text-foreground">Save your recovery code</p>
        <p className="mt-1 text-sm text-muted">
          DutchTap does not collect email addresses, so this is your only way to reset your password.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-accent bg-surface px-4 py-5 text-center">
        <p className="font-mono text-xl font-bold tracking-wider text-foreground">{code}</p>
      </div>

      <button
        type="button"
        onClick={copy}
        className="h-11 w-full rounded-xl border border-border text-sm font-medium text-foreground"
      >
        {copied ? "Copied!" : "Copy code"}
      </button>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
        />
        I&apos;ve saved this code somewhere safe.
      </label>

      <button
        type="button"
        disabled={!confirmed}
        onClick={onContinue}
        className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
