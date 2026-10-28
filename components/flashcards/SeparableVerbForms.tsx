import { separableFormsFor } from "@/lib/separableForms";

/** The particle is shown in bold wherever the verb has a visible one, so its movement can be followed row by row. */
function Marked({ text, particle }: { text: string; particle: string }) {
  const parts = text.split(new RegExp(`(\\b${particle}\\b)`));
  return <>{parts.map((part, i) => (part === particle ? <strong key={i} className="text-accent">{part}</strong> : part))}</>;
}

/** The forms of the separable verb behind one card, with the particle marked. Only separable cards have one. */
export function SeparableVerbForms({ cardId }: { cardId: string }) {
  const f = separableFormsFor(cardId);
  if (!f) return null;
  const rows: [string, string][] = [
    ["Infinitive", f.lemma],
    ["Main clause (present)", f.mainClause],
    ["Main clause (simple past)", f.simplePast],
    ["Perfect", f.perfect],
    ["Modal + infinitive", f.modal],
    ["te + infinitive", f.teInfinitive],
    ["Dependent clause (present)", f.subordinate],
    ["Dependent clause (past)", f.subordinatePast],
    ["Imperative", f.imperative],
  ];
  return (
    <section aria-label="Verb forms" data-testid="separable-forms" className="mt-4">
      <h3 className="eyebrow">Forms of {f.lemma}</h3>
      <p className="mt-1 text-xs text-muted">
        Particle <strong lang="nl" className="text-accent">{f.particle}</strong> + <span lang="nl">{f.base}</span> · perfect with <span lang="nl">{f.auxiliary}</span>
        {f.preposition ? <> · usually with <span lang="nl">{f.preposition}</span></> : null}{f.reflexive ? " · usually reflexive" : null}
      </p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-border align-top">
              <th scope="row" className="py-1 pr-3 text-left text-xs font-semibold text-muted">{label}</th>
              <td lang="nl" className="py-1 font-medium"><Marked text={value} particle={f.particle} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">The particle stays attached in the infinitive, in a dependent clause and in the participle; it moves to the end of a main clause. Forms are AI-authored and not yet checked by a native speaker.</p>
    </section>
  );
}
