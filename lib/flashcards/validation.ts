import { z } from 'zod';
import { CARDS, LEVELS } from './engine';
const ids = new Set(CARDS.map(c=>c.id));
const count = z.number().int().nonnegative().max(1_000_000);
export const reviewSchema = z.object({
  id: z.string().refine(id=>ids.has(id)), level: z.enum(LEVELS), masteredCount: count, seen: count,
  quizCorrect: count, quizWrong: count, quizStreak: count, updatedAt: z.iso.datetime(),
});
export const reviewsSchema = z.record(z.string(),reviewSchema).refine(records=>Object.entries(records).every(([id,r])=>id===r.id));
export const syncSchema = z.object({records: z.array(reviewSchema).max(CARDS.length)});
