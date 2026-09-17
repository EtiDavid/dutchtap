"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { isRouteMode } from "@/lib/game/modes";
import { GameScreen } from "@/components/game/GameScreen";

export default function GamePage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = use(params);

  if (!isRouteMode(mode)) {
    notFound();
  }

  return <GameScreen mode={mode} />;
}
