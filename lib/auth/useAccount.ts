"use client";

import { useCallback, useEffect, useState } from "react";

export type Account = { username: string; lifetimeScore: number; totalCorrect: number; totalWrong: number };

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        setAccount(await res.json());
      } else {
        setAccount(null);
      }
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Session status can only be checked client-side (HTTP-only cookie);
    // the resulting setState calls happen after an async fetch resolves,
    // not synchronously — this is the standard fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
  }, []);

  return { account, loading, refresh, logout };
}
