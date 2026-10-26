import { sharedCard } from "@/lib/content/cards";
/** A conservative explanation of clauses, not an untested syntactic parser.
 * Only an explicitly tagged ALS lesson card reaches this view. */
export function GrammarAlsAnalysis({cardId}:{cardId:string}){
 const card=sharedCard(cardId);
 if(!card||card.category!=="als")return null;
 const whole=card.dutch.trim().replace(/[.!?]$/,"");
 const front=whole.match(/^(?:Pas )?Als\b[^,]*,\s*(.+)$/i);
 let subordinate:string|null=null,main:string|null=null,fronted=false;
 if(front){const i=whole.indexOf(",");subordinate=whole.slice(0,i);main=whole.slice(i+1).trim();fronted=true;}
 else {const i=whole.toLowerCase().indexOf(" als ");if(i>=0){main=whole.slice(0,i);subordinate=whole.slice(i+1);}}
 if(!subordinate||!main) return <p className="mt-3 text-sm">{card.grammar}</p>;
 const imperative = /^(Bel|Stop|Laat|Vraag|Kijk|Controleer|Stuur|Zet|Maak|Neem|Vul|Geef)\b/i.test(main);
 return <section className="mt-4 space-y-3 border-t border-border pt-4" data-testid="als-clause-analysis">
   <h3 className="text-sm font-bold">Sentence map: why the order works</h3>
   <p className="text-xs text-muted">Two complete parts: first locate the subordinate clause, then the finite verb of the main clause.</p>
   <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
     <div className="rounded-xl border border-border bg-surface p-3"><p className="text-xs font-semibold text-accent">SUBORDINATE CLAUSE · bijzin</p><p lang="nl" className="mt-1 text-sm font-bold">{subordinate}</p><p className="mt-2 text-xs text-muted">ALS introduces a condition or time relationship. In simple clauses the finite verb follows the other elements; longer final verb clusters need their own rules.</p></div>
     <div className="rounded-xl border border-border bg-surface p-3"><p className="text-xs font-semibold text-accent">MAIN CLAUSE · hoofdzin</p><p lang="nl" className="mt-1 text-sm font-bold">{main}</p><p className="mt-2 text-xs text-muted">{fronted?imperative?"This is an instruction after a fronted subordinate clause. Compare it with ordinary V2 statements.":"The fronted ALS clause occupies position one, so the following main-clause finite verb precedes the subject (V2 inversion).":"The main clause comes first and uses its normal sentence order. An instruction can start directly with its imperative verb."}</p></div>
   </div>
   <p className="text-sm leading-relaxed"><strong>Why this sentence:</strong> {card.grammar}</p>
   <p className="text-xs text-muted">Compare the full word order in the topic lesson above. This analysis names clause roles; it does not automatically verify spoken answers.</p>
 </section>;
}
