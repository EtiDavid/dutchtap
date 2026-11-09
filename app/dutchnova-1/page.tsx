import { redirect } from "next/navigation";

export default function DutchNovaLegacyRoute() {
  // The lesson pack belongs to the normal fixed-card session collection.
  redirect("/flashcards?new=dutchnova_1:all");
}
