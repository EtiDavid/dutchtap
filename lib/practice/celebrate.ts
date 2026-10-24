/** Called only for a newly submitted, objectively correct quiz answer. */
export function celebrateCorrect() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('dutchtap:correct'));
}
