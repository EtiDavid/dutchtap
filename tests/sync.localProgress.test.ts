import { describe, expect, it } from "vitest";
import {
  createEmptyLocalProgress,
  LOCAL_PROGRESS_SCHEMA_VERSION,
  migrateLocalProgress,
} from "@/lib/sync/localProgress";

describe("migrateLocalProgress", () => {
  it("returns a fresh state for null/undefined input", () => {
    expect(migrateLocalProgress(null).schemaVersion).toBe(LOCAL_PROGRESS_SCHEMA_VERSION);
    expect(migrateLocalProgress(undefined).schemaVersion).toBe(LOCAL_PROGRESS_SCHEMA_VERSION);
  });

  it("returns a fresh state for garbage input rather than throwing", () => {
    expect(() => migrateLocalProgress("not an object")).not.toThrow();
    expect(() => migrateLocalProgress(42)).not.toThrow();
    expect(() => migrateLocalProgress({ random: "shape" })).not.toThrow();
  });

  it("returns a fresh state for a future schema version it doesn't understand", () => {
    const future = { ...createEmptyLocalProgress(), schemaVersion: LOCAL_PROGRESS_SCHEMA_VERSION + 1 };
    const migrated = migrateLocalProgress(future);
    expect(migrated.schemaVersion).toBe(LOCAL_PROGRESS_SCHEMA_VERSION);
    expect(migrated.progressByKey).toEqual({});
  });

  it("preserves valid current-version data", () => {
    const state = createEmptyLocalProgress();
    state.lifetimeScore = 42;
    const migrated = migrateLocalProgress(state);
    expect(migrated.lifetimeScore).toBe(42);
  });
});
