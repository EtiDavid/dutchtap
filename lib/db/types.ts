import type { ObjectId } from "mongodb";
import type { ProgressRecord } from "@/lib/mastery/types";
import type { GameMode } from "@/lib/grammar/types";

export type UserDocument = {
  _id: ObjectId;
  username: string;
  usernameLower: string;
  passwordHash: string;
  recoveryCodeHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  lifetimeScore: number;
  totalCorrect: number;
  totalWrong: number;
  settings: { haptics: boolean };
  failedLoginAttempts: number;
  loginLockedUntil: Date | null;
  failedRecoveryAttempts: number;
  recoveryLockedUntil: Date | null;
};

export type ProgressDocument = ProgressRecord & {
  _id: ObjectId;
  userId: ObjectId;
  updatedAt: Date;
};

export type SessionDocument = {
  _id: ObjectId;
  userId: ObjectId;
  mode: GameMode | "weak-review";
  startedAt: Date;
  endedAt: Date;
  questions: number;
  correct: number;
  wrong: number;
  scoreEarned: number;
  accuracy: number;
};
