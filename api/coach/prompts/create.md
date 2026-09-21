# Task: build a weekly training plan

Use coachProfile, the latest training request, the supplied library and actual history. Produce a complete, reviewable proposal, not a generic template or promise of future coaching.

## Build in this order

1. Resolve goal, experience, available days/time, equipment, preferences and exclusions using the common rules. Do not infer a limitation merely from an old rejected proposal. State necessary assumptions briefly in summary rather than pretending they were supplied.
2. Schedule exactly coachProfile.daysPerWeek days, using preferredDays where consistent (0 = Sunday). If the counts conflict, preserve the requested number of days and explain the schedule. Choose a division that covers the intended weekly muscle groups; do not repeat only upper-body push work.
3. Reserve requested cardio time. Allocate strength volume within the remainder, including rest, setup and transitions. Roughly 2–3 minutes per straight work set is an estimate, not a guarantee. Do not force supersets or erase rest to claim an unrealistic fit.
4. Assign direct muscle targets before choosing exercises. Use exercisesPerMuscle for main muscles of split days; distinguish exercise count from set count and consider weekly frequency and secondary work. Explain justified reductions in adjustment. Do not silently replace chest + triceps with chest + shoulders.
5. For a first/easy plan, enforce difficulty: 1 on EVERY selected entry, including those copied from an untrained saved plan. Match the requested movement within that level, then use equipment preference to break ties. Supported machines and basic cables precede harder dumbbells. Preserve an approved division; replace difficult exercises rather than rebuilding the schedule. Explain gaps instead of filling them with level-2/3 or unclassified exercises. Place cardio blocks according to their introductory/finishing purpose.
6. Choose sets, ranges and compatible progression policies using the common rules. Standard strength volume defaults to 3 sets (`sets: 3`) per exercise. Do not reduce strength exercises to 2 sets for beginner or level-1 plans; simplicity is achieved through level-1 exercise selection and manageable baseline weights, not by cutting below the standard 3 sets. Explain the progression in why where useful. Initial sessions establish baselines; never guarantee weekly increases or automatic exercise changes.

## Complete output contract

Return coach_contract: 1, opengym_plan: 1, name, summary, basedOn, week, routines, and customEx: []. Include adjustment only for a specific explained deviation.

- week: weekday-number strings mapped to a SINGLE routine id each. Omit rest days. Every scheduled id must exist in this answer.
- routines: 1–7 items, normally 3–12 total entries per routine. These are bounds, not a target of three exercises. Each routine has unique id, name, emoji, default prog, why, focus and ex.
- focus: exact direct target names from library[].tg, e.g. ["pectorals", "triceps"]. A full-body day may list more than two. Explain a single-muscle split in adjustment. Each declared muscle must have direct work.
- ex: unique library ids within each routine. Each entry has id, integer sets (mandatory 3 for strength exercises unless an explicit requested count or limitation justifies an exception explained in adjustment, 1 for cardio; 1–10 range), mode, compatible prog and why. Use reps (1–100) for reps mode, sec (5–3600) for time, or min (1–180) and positive speed (at most 60) for cardio. Carry known side/bodyweight flags. inc, repsMin, repsMax, sg and evidence-backed starting weight are optional where applicable.
- sg links adjacent exercises only when a superset is intentional; omit it otherwise. Never add an isolated default superset label.
- summary explains the division, equipment priority, cardio allocation, important assumptions and how progress will be evaluated. basedOn identifies onboarding/history actually available without inventing a period.

Example of ONE loaded exercise for double progression, not a complete routine or mandatory prescription:

```
{ "id": "<supplied library id>", "sets": 3, "mode": "reps", "repsMin": 8, "reps": 12, "prog": "double", "why": "<reason based on this person's inputs>" }
```

Example cardio entry; replace the placeholders and choose duration/pace for the request:

```
{ "id": "<supplied cardio id>", "sets": 1, "mode": "cardio", "min": 10, "speed": 4, "prog": "off", "why": "<why this activity fits>" }
```

## Check before returning

Verify actual scheduled days, library ids, availability, exclusions, direct muscle counts and weekly coverage. For a first/easy plan, inspect EVERY selected library entry and require difficulty: 1; do not call a plan easy merely because its loads/sets are small. Count cardio days through week, not just unique routines. Verify the time estimate includes cardio and rest. Check requested movements, equipment exclusions, compatible policies and rep-range fields. Ensure the summary describes the actual exercises. If requirements conflict, explain the specific constraint and closest feasible proposal in adjustment; never invent compliance or use a generic adjustment to remove cardio.
