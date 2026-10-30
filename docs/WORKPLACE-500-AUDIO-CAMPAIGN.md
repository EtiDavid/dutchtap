# Workplace audio: 500-recording preparation

The frozen candidate list is in `data/editorial/audio-workplace-500-review.json`.

It contains 500 not-yet-recorded workplace sentences, 50 per category, totaling 24,033 Dutch characters.

The recordings have **not** been generated. All entries have `approvedForRecording: false` pending an editorial reading of Dutch text against the English scenarios and explanations. Source records were previously AI-editorially-reviewed, not verified by an independent native speaker.

Do not launch paid ElevenLabs generation or label this campaign completed until the selected lines are reviewed and the available credit budget is checked. The existing `audio:generate` script allows at most 14,000 characters per paid run and supports resuming by ID. Split this campaign into five groups of 100 (4,999 / 4,707 / 4,864 / 4,672 / 4,791 characters).
