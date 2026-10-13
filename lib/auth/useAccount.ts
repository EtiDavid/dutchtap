"use client";

import { useCallback, useEffect, useState } from "react";

export type Account = { username: string; lifetimeScore: number; totalCorrect: number; totalWrong: number };

// One lookup is shared by every component on a page, so opening a screen costs a single /api/auth/me request.
let inflight: Promise<Account | null> | null = null;
async function lookupAccount(force: boolean): Promise<Account | null> {
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me");
      return res.ok ? ((await res.json()) as Account) : null;
    } catch {
      return null;
    } finally {
      setTimeout(() => { inflight = null; }, 1500);
    }
  })();
  return inflight;
}

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setAccount(await lookupAccount(true));
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void lookupAccount(false).then((found) => { if (!cancelled) { setAccount(found); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    inflight = null;
    setAccount(null);
  }, []);

  return { account, loading, refresh, logout };
}
