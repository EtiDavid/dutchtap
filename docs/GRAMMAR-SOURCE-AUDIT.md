# Grammar mastery source audit — phase P0 (initial)

> **Historical initial-scan snapshot, not the current inventory.** This report measured the first ALS-focused implementation before the new separable-verb and conjunction expansions. Its nine-topic breakdown, 196 legacy-card table, and initial lesson count are **not current branch totals**. For the verified current 13-topic counts (432 authored + 53 linked = 485 grammar base cards), missing requirements and release status, see [Grammar Mastery Acceptance Audit](GRAMMAR-MASTERY-ACCEPTANCE-AUDIT.md) and [Grammar Patterns Guide](GRAMMAR-PATTERNS.md). Raw keyword matches below remain **unreviewed candidates**, not approved grammar tags.

**Repository:** `EtiDavid/dutchtap`  
**Audited branch:** `feat/grammar-mastery-phase1`  
**Baseline main SHA:** `75d5b30def8da560351d060415a89934c03d6264`  
**Audit date:** 2026-10-26 (based on the connected repository data)

## Corpus facts

- Original Everyday + Dutch at Work source cards: **1200**. No original card was overwritten by this feature branch.
- Legacy authored grammar cards: **196**, with legacy IDs retained.
- New authored ALS parent cards: **58** (29 meaningfully contrasted pairs).
- Explicitly linked original ALS cards: **23** reference aliases; source remains the original Core ID.
- Total **100 ALS playable base cards**: original 19 + new 58 + linked 23. Passive example sentences in notes do not count.
- Interactive grammar children currently authored: **30** across **3** parent families; the other parents have no interactive children yet.
- Topic-wide lesson entries: **9**. Only ALS and Separable are detailed v1.0 lessons; other topics are explicitly marked introductory v0.2.

### Legacy vs new authored grammar cards by topic

| Topic | Legacy | New expansion | Reused Core | Available base cards |
| --- | ---: | ---: | ---: | ---: |
| inversion | 20 | 0 | 0 | 20 |
| omdat | 20 | 0 | 0 | 20 |
| dat | 20 | 0 | 0 | 20 |
| als | 19 | 58 | 23 | 100 |
| tot | 20 | 0 | 0 | 20 |
| toen | 20 | 0 | 0 | 20 |
| verbs | 36 | 0 | 0 | 36 |
| separable | 24 | 0 | 0 | 24 |
| tense | 17 | 0 | 0 | 17 |

## Candidate Core grammar matches — **NOT classified/approved**

**These are raw substring candidates, *not* grammar tags.** A match such as `als een plan` is not an ALS subordinate clause; `dat` can be demonstrative or relative rather than a conjunction, `of` can coordinate, `toen` can be an adverb, and `tot` may be a preposition.

| Expression | Raw Core matches |
| --- | ---: |
| `als` | 31 |
| `omdat` | 9 |
| `dat` | 39 |
| `toen` | 2 |
| `wanneer` | 12 |
| `terwijl` | 1 |
| `voordat` | 10 |
| `nadat` | 0 |
| `tot` | 12 |
| `totdat` | 3 |
| `zodra` | 9 |
| `zolang` | 2 |
| `sinds` | 4 |
| `nu` | 19 |
| `indien` | 0 |
| `mits` | 0 |
| `tenzij` | 0 |
| `doordat` | 0 |
| `aangezien` | 0 |
| `zodat` | 1 |
| `hoewel` | 0 |
| `alhoewel` | 0 |
| `alsof` | 0 |
| `zoals` | 0 |
| `naarmate` | 0 |
| `want` | 1 |
| `daarom` | 0 |
| `of` | 22 |
| `die` | 2 |
| `wat` | 50 |
| `waar` | 23 |
| `hoe` | 11 |
| `waarom` | 4 |

### Candidate examples (for manual editorial review)

#### `als` — 31 raw matches
- conversation-20: Laat het me weten als je iets nodig hebt.
- conversation-69: Ik verlies mijn geduld als mensen onbeleefd zijn.
- work-71: Dat klinkt als een plan.
- career-changes-048: Als het werk uitloopt, stoppen we op het afgesproken moment.
- career-changes-056: Als de controle mislukt, herstellen we de vorige instelling.

#### `omdat` — 9 raw matches
- school-09: Ik ben te laat omdat mijn trein vertraging heeft.
- work-212: Hij vertrok vroeg omdat de trein uitviel.
- career-meetings-023: De planning loopt uit omdat de gegevens ontbreken.
- career-office-053: Ik kom morgen naar kantoor omdat de nieuwe medewerker begeleiding nodig heeft.
- career-priorities-007: Omdat meerdere teams vastzitten, pakken we dit probleem eerst aan.

#### `dat` — 39 raw matches
- school-01: Kunt u dat nog eens uitleggen?
- conversation-22: Dat is een geweldig idee!
- conversation-27: Ik had dat verhaal al eens gehoord.
- conversation-29: Dat klinkt geweldig!
- shopping-23: Dat lijkt op goud.

#### `toen` — 2 raw matches
- work-274: Ik was niet op kantoor toen de levering aankwam.
- work-321: Ik had het voorbereidende werk al gedaan toen de monteur aankwam.

#### `wanneer` — 12 raw matches
- school-06: Wanneer moeten we dit inleveren?
- work-11: Wanneer is de deadline?
- transport-36: Wanneer komen ze aan?
- career-changes-043: De gebruiker moet vooraf weten wanneer de onderbreking begint.
- career-changes-053: Wanneer draaien we de wijziging terug?

#### `terwijl` — 1 raw matches
- career-troubleshooting-036: Ik vergelijk de resultaten terwijl jij de tijden noteert.

#### `voordat` — 10 raw matches
- home-33: Je gaat je kamer opruimen voordat je weggaat.
- work-174: Doe dit voordat je vertrekt.
- work-330: Wees slim en vergelijk de prijzen voordat je boekt.
- career-changes-030: Voordat we beginnen, bevestigen we de stopcriteria.
- career-changes-052: We moeten een herstelplan hebben voordat we beginnen.

#### `tot` — 12 raw matches
- health-04: Ze gaan in de wachtkamer zitten tot de dokter ze roept.
- career-changes-002: Kun je toegang tot de testomgeving aanvragen?
- career-changes-003: Een werkende aanmelding geeft niet automatisch toegang tot alle mappen.
- career-changes-006: De toegang geldt tot het einde van deze week.
- career-changes-009: Deze aanvraag betreft geen toegang tot klantgegevens.

#### `totdat` — 3 raw matches
- school-11: Blijf proberen totdat je het snapt.
- career-incidents-050: Totdat de overname bevestigd is, blijf ik verantwoordelijk.
- career-support-054: Het ticket blijft open totdat u het resultaat hebt bevestigd.

#### `zodra` — 9 raw matches
- work-25: We lossen problemen op zodra ze zich voordoen.
- work-187: Ze zullen u bellen zodra de bestelling klaar is.
- career-incidents-040: Zodra de gewone dienst hersteld is, stoppen we met deze omweg.
- career-meetings-059: Zodra de controle klaar is, stuurt de eigenaar een update.
- career-office-035: Ik kom terug zodra mijn pauze voorbij is.

#### `zolang` — 2 raw matches
- career-meetings-027: Zolang de toegang ontbreekt, blijft de test geblokkeerd.
- career-troubleshooting-049: Ik wil niet gissen zolang de gegevens ontbreken.

#### `sinds` — 4 raw matches
- career-incidents-010: Ik meld dat de dienst sinds negen uur onbereikbaar is.
- career-meetings-010: Er zijn sinds gisteren geen nieuwe blokkades.
- career-office-034: Ik heb nog geen pauze genomen sinds het eerste telefoontje.
- career-problems-022: Sinds de update werkt de zoekfunctie niet meer.

#### `nu` — 19 raw matches
- home-21: Slaap je nu?
- conversation-56: Wie is daar nu?
- transport-33: We gaan nu weg.
- leisure-19: Ze is nu aan het zingen.
- work-67: Schrijf je nu het verslag?

#### `zodat` — 1 raw matches
- career-priorities-034: Ik meld de vertraging nu, zodat we nog kunnen bijsturen.

#### `want` — 1 raw matches
- work-198: Praat nu, want straks begint de vergadering.

#### `of` — 22 raw matches
- work-169: Wat is beter: repareren of vervangen?
- career-changes-008: Ik controleer of de gebruiker de juiste rol heeft.
- career-changes-027: Ik controleer of het testaccount klaarstaat.
- career-changes-060: De beheerder beslist of we mogen doorgaan.
- career-clarification-008: Zei u maandag of dinsdag?

#### `die` — 2 raw matches
- career-clarification-053: Ik begrijp niet altijd de afkortingen die jullie gebruiken.
- career-clarification-055: Kunt u die uitdrukking met gewone woorden omschrijven?

#### `wat` — 50 raw matches
- school-03: Wat betekent dit woord?
- conversation-02: Kun je wat langzamer spreken?
- administration-01: Wat is de huidige wisselkoers?
- conversation-12: Wat is uw mening hierover?
- food-02: Mag ik wat water?

#### `waar` — 23 raw matches
- shopping-01: Waar kan ik de melk vinden?
- transport-08: Waar kan ik mijn ticket kopen?
- home-01: Waar zijn mijn sleutels?
- conversation-05: Waar kom je vandaan?
- conversation-13: Waar ging zij heen?

#### `hoe` — 11 raw matches
- transport-05: Hoe laat komt de trein aan?
- conversation-03: Hoe gaat het met je?
- leisure-05: Hoe vaak train je?
- food-12: Hoe is het ontbijt?
- work-129: Hoe gaat het met je werk?

#### `waarom` — 4 raw matches
- conversation-78: Ik wil weten waarom.
- work-255: Ik begrijp waarom je twijfelt.
- career-changes-039: We weten nog niet waarom deze stap mislukt.
- career-troubleshooting-040: Ik weet nog niet waarom de resultaten verschillen.

## Architecture decisions and change boundary

1. **Authoritative plan** is `docs/GRAMMAR-MASTERY-MASTER-PLAN.md`. The planning baseline is preserved intact; implementation status is tracked in a separate worklog.
2. **Stable IDs:** existing `pat-*` IDs and source texts are preserved; new ALS authored IDs append starting at `pat-als-20`, without shifting other topic IDs.
3. **Explicit cross-collection references:** `data/grammar-reuse-links.json` points to Core cards by source ID; the engine hydrates a grammar alias at runtime. No duplication of underlying audio/text content.
4. **Independent progress:** alias cards have new grammar-specific IDs, so an existing Everyday “Mastered” label does not automatically certify mastery of ALS. This is a deliberate D01 decision; full multi-topic mastery is pending.
5. **Optional children:** the existing variation engine is extended for the first three ALS parents with ten reviewed children each; other parents are untouched. Fewer-than-ten families remain intentionally hidden rather than padded.
6. **Prompting:** when authored, `scenarioNl` provides Dutch-first Speaking and Quiz prompts; cards lacking that metadata explicitly fall back to English.
7. **No stored-session schema migration** in this first slice. Existing fixed-card IDs, slot limits, local-first sync and French behavior remain.
8. **Deployment:** Vercel's Git auto-deploy is disabled in `vercel.json`; production uses tagged release workflow. Do not merge or tag while partial.
9. **Missing work** includes authored Dutch prompts for legacy/linked ALS cards, extra families for most ALS parents, accepted alternative models, error-correction quizzes, broader conjunction coverage, and individual editorial verification of remaining app lessons.

## Content evidence and limitations

This audit establishes exact *structural* counts, IDs and source paths. It does **not** establish native-speaker approval or verify all 1,200 Core grammar cases. Every reused ALS link was picked manually rather than by naive substring matching. All new content is AI-drafted and subject to dedicated linguistic QA.

## Reproducibility

Run `python3 scripts/build-grammar-patterns.py` and confirm `git diff --exit-code -- data/grammar-pattern-cards.json data/grammar-pattern-notes.json`. Run lint, `next typegen`, `tsc`, Vitest and a production build (see the feature workflow).
