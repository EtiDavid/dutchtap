import type { ProgressRecord } from "@/lib/mastery/types";

const STORAGE_KEY = "dutchtap:guest-progress";
export const LOCAL_PROGRESS_SCHEMA_VERSION = 1;

export type LocalProgressState = {
  schemaVersion: number;
  progressByKey: Record<string, ProgressRecord>;
  lifetimeScore: number;
  totalCorrect: number;
  totalWrong: number;
  createdAt: string;
  updatedAt: string;
};

export function createEmptyLocalProgress(now: string = new Date().toISOString()): LocalProgressState {
  return {
    schemaVersion: LOCAL_PROGRESS_SCHEMA_VERSION,
    progressByKey: {},
    lifetimeScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Migrates older/foreign shapes forward. Unknown or corrupt data is
 * replaced with a fresh empty state rather than crashing gameplay.
 */
export function migrateLocalProgress(raw: unknown): LocalProgressState {
  if (!raw || typeof raw !== "object") return createEmptyLocalProgress();

  const candidate = raw as Partial<LocalProgressState>;
  if (typeof candidate.schemaVersion !== "number" || typeof candidate.progressByKey !== "object") {
    return createEmptyLocalProgress();
  }

  // Future migrations branch on schemaVersion here. For now v1 is the only version.
  if (candidate.schemaVersion > LOCAL_PROGRESS_SCHEMA_VERSION) {
    return createEmptyLocalProgress();
  }

  return {
    schemaVersion: LOCAL_PROGRESS_SCHEMA_VERSION,
    progressByKey: candidate.progressByKey ?? {},
    lifetimeScore: typeof candidate.lifetimeScore === "number" ? candidate.lifetimeScore : 0,
    totalCorrect: typeof candidate.totalCorrect === "number" ? candidate.totalCorrect : 0,
    totalWrong: typeof candidate.totalWrong === "number" ? candidate.totalWrong : 0,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadLocalProgress(): LocalProgressState {
  if (!isStorageAvailable()) return createEmptyLocalProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyLocalProgress();
    return migrateLocalProgress(JSON.parse(raw));
  } catch {
    return createEmptyLocalProgress();
  }
}

export function saveLocalProgress(state: LocalProgressState): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
  } catch {
    // Storage full / disabled (private browsing, etc). Guest gameplay
    // continues in-memory for this session; nothing to do here.
  }
}

export function clearLocalProgress(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
