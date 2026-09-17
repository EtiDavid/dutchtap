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
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
  }, []);

  return { account, loading, refresh, logout };
}
