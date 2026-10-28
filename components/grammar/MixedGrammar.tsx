"use client";
import dynamic from "next/dynamic";

/** The round is random and the answers live on this device, so it renders on the client only. */
export const MixedGrammar = dynamic(() => import("./MixedGrammarClient"), { ssr: false, loading: () => <main className="mx-auto min-h-dvh max-w-lg px-5 py-6"><p className="text-muted" role="status">Preparing your round…</p></main> });
