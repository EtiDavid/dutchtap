# Content and grammar coverage

The machine-readable counts are in `content-counts.json`, parent annotations in `grammar-coverage.json`, and the 720 distinct child annotations in `child-grammar-coverage.json`. Each parent has ten family entries with stable IDs `<parent>~v01` through `~v10`.

| Area | Parents | Child entries | Distinct child sentences |
| --- | ---: | ---: | ---: |
| Office conversation and introductions | 60 | 600 | 72 |
| Help, clarification and repetition | 60 | 600 | 72 |
| User support and support requests | 60 | 600 | 72 |
| Problems and their impact | 60 | 600 | 72 |
| Troubleshooting and explaining steps | 60 | 600 | 72 |
| Meetings and progress updates | 60 | 600 | 72 |
| Tasks, priorities and deadlines | 60 | 600 | 72 |
| Changes, testing, access and permission | 60 | 600 | 72 |
| Incidents, escalation and handovers | 60 | 600 | 72 |
| Email, chat and remote collaboration | 60 | 600 | 72 |
| **Total new** | **600** | **6,000** | **720** |

There are 1,320 distinct new practice situations and 1,389 model answers, all distinct after normalisation. Sixty-nine are additional reviewed alternatives. One answer remains where further wording would be artificial. Alternatives use the existing persisted rotation and the same card's progress.

Vocabulary adds 290 entries and adds workplace backlinks to 60 existing entries. All 600 parents have real vocabulary links; original definitions and occurrence order are preserved. Nouns supply articles, useful plurals and contextual meanings. New verbs show explicitly reviewed present, past and perfect forms plus fixed-combination and separability notes. Vocabulary remains text-only.

The collection practises statements, yes/no and subject questions, V2 with fronted phrases, present/past/perfect/past-perfect, future plans, modal questions, polite zou/zouden, instructions, separable verbs, purpose infinitives, ongoing actions, reflexives, negation, er, comparisons and quantities. It includes omdat, dat, of, als, toen, terwijl, voordat, nadat and zodra, as well as sinds, al, nog, pas and niet meer. Possessives and adjective endings are explained where relevant, including ons/onze, de/het words and plural forms. A row's primary pattern is a teaching index, not an assertion that the sentence contains only that phenomenon.

The six smaller situations per area are recorded in `PLAN.md`. Child sets stay within the parent's smaller workplace situation. Related parents intentionally share a thematic practice library; no generic set is attached to all 600 parents. All 600 family sets are distinct.

Run `npm run content:workplace` to reject stale assembled files, unknown verb/family references, duplicates and incomplete counts. Run the content and session tests for vocabulary backlinks, protected data/media hashes, French isolation, persisted rotation, fixed decks, child unlocking and offline replay. Automated checks complement the editorial process; they do not provide native-speaker certification.
