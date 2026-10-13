import type { Reviews } from '@/lib/flashcards/engine';
import type { SessionStore } from '@/lib/sessions/store';
import type { Session } from '@/lib/sessions/types';

export type ModeProps = {
  session: Session;
  store: SessionStore;
  /** The learner's global card levels. */
  reviews: Reviews;
  reviewsReady: boolean;
  /** Records a practice day for the (gentle) streak. */
  onPractised: () => void;
};
