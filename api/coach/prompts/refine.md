# Task: revise the proposed plan

Read refine.previous and refine.text. Return the complete revised plan, not a patch or review change-set. Follow the common onboarding, equipment, volume, cardio and progression rules.

## Scope the revision

1. Identify the requested changes and necessary consequences for time, schedule or coverage. Preserve unaffected routine ids, exercises and prescriptions where possible.
2. A request for a first/easy/level-1 plan requires EVERY exercise to have difficulty: 1 in the supplied library and default to standard 3 work sets (`sets: 3`). Replace harder and unclassified entries, not just their loads or titles, while preserving the approved weekly division. Match the requested movement with supported machines/basic cables where suitable. If unavailable, explain a gap or reduced count instead of silently admitting a level-2/3 exercise. A saved dumbbell preference does not override this request; if an explicit dumbbells-only restriction conflicts, explain it. Missing cardio means adding real entries with duration.
3. Retain real limitations and exclusions. Do not carry invented restrictions forward from an earlier proposal or interpret a rejected machine-heavy proposal as a machine preference.
4. Fit revised strength volume and cardio within the stated time. Honour the latest explicit training request; if it conflicts with a still-supplied structured profile target, identify the discrepancy in adjustment instead of claiming both are met.
5. A refinement is not evidence of improved strength, technique or readiness. Preserve working progression unless the request or history warrants changing it. Never transfer starting weight between exercise ids.

## Complete output contract

Return one object with coach_contract: 1, opengym_plan: 1, name, summary, basedOn, week, routines, customEx: [], and optional adjustment.

- week maps weekday-number strings (0 Sunday through 6 Saturday) to one routine id each. Schedule the requested number of days; omit rest days. All ids must exist in routines.
- routines contains 1–7 items, normally 3–12 total entries each. Each routine has id, name, emoji, compatible default prog, why, focus and ex.
- focus lists exact direct target names from library[].tg; every declared muscle must be represented. Honour requested per-muscle counts on split days; explain a reduced count or single-muscle split in adjustment.
- Each ex entry uses a unique supplied library id within the routine, sets (mandatory 3 for strength exercises unless an explicit requested count or limitation justifies an exception explained in adjustment, 1 for cardio; integer 1–10), mode, compatible prog and why. Rep mode uses reps (1–100); time uses sec (5–3600); cardio uses min (1–180), positive speed (at most 60), sets: 1 and prog: "off". Optional repsMin, repsMax, inc, sg, side, bodyweight and evidence-backed starting weight follow the common rules. For loaded double, repsMin is the floor and reps is the ceiling.
- summary names the actual changes and reasons. basedOn names only supplied evidence. adjustment explains a specific constraint, not arbitrary noncompliance; only the common rules' narrow exceptions permit cardio omission.

Before returning, recheck the entire revised week's days, availability, exclusions, direct muscle work, movement matching, appropriate difficulty, equipment preference, time, cardio and progression compatibility. Changing one part must not silently undo another preference.
