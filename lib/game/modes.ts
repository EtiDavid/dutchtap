import type { GameMode } from "@/lib/grammar/types";

export type RouteMode = GameMode | "weak-review";

export const ROUTE_MODES: RouteMode[] = ["article", "demonstrative", "adjective", "weak-review"];

export const MODE_TITLES: Record<RouteMode, string> = {
  article: "De or Het",
  demonstrative: "Deze · Dit · Die · Dat",
  adjective: "Adjective Ending",
  "weak-review": "Review Weak Words",
};

export function isRouteMode(value: string): value is RouteMode {
  return (ROUTE_MODES as string[]).includes(value);
}
