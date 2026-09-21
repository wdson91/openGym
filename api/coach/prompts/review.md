# Task: review training and propose plan changes

Read plan, window, aggregates, coachProfile and userNote. Decide whether the plan needs an adjustment. This is a small change-set against the existing plan, not a new weekly plan or a day-to-day weight prescription.

## Evidence and decision order

1. Separate an explicit user request or stated limitation from an inferred performance trend. With no trained sessions, do not invent performance-based changes. A clear equipment/schedule preference or limitation can still justify a targeted correction without history.
2. Compare recent sessions of the SAME exercise under comparable loads and prescriptions. Three unrelated workouts are not three exposures to that exercise. With fewer than three comparable exposures or less than a week of evidence, normally observe rather than restructure; an explicit request or limitation can justify an earlier change.
3. Treat stalls >= 2 as a reason to inspect, not an automatic swap/cut. The aggregate is coarse: cross-check changing loads, improving reps within a range, incomplete logging and current policy. If detail is missing, say what needs observation. Do not assume the aggregate matches the engine's policy-specific stall count.
4. If the current policy is progressing the exercise, return nochange. Consider the engine's existing adjustment after repeated misses before changing the plan; do not pre-empt it with a competing load instruction. If a documented problem persists after an adjustment, consider one proportionate prescription/policy change before a movement swap.
5. Distinguish adherence, duration and exercise-specific problems. Repeated missed days may justify a schedule change, not heavier training. Consistently excessive duration may justify reducing strength volume or a suitable superset while preserving requested cardio and explaining any reduced per-muscle target.
6. Evaluate weekly coverage, not one session's missing muscle. Broad body-part counts are not muscle-specific volume. Add work only for a demonstrated gap or explicit request, within available time and constraints.
7. Change exercises for a supported mismatch, persistent issue, availability problem or explicit preference. Preserve successful basics; do not rotate for novelty, elapsed weeks or because a higher difficulty exists. Match movement first, then appropriate execution difficulty, then equipment preference for new/replacement exercises. Simplification may legitimately replace a dumbbell exercise with a supported machine or cable exercise.
8. Bodyweight direction or cohort comparisons alone are notes, not reasons for plan changes. Do not invent recovery, sleep or technique explanations.

Prefer one focused intervention; normally propose at most three independent changes, never more than six. Explain each with evidence and the next signal to observe. Do not assume every proposed change will be accepted together.

## Cardio review

Cardio progresses through evidence-based review proposals, not the automatic strength engine; keep prog: "off". Preserve frequency and the minimum TOTAL across the session's blocks (at least 10 minutes or the configured larger target). Introductory 5-minute blocks are allowed when the session total meets the target. Compare the same activity and block purpose across at least three comparable completed exposures, using logged effort or explicit user feedback. Completion alone does not establish that the pace was easy. Without enough evidence, maintain the prescription and request feedback.

When repeated completion and manageable reported effort support progress, propose one small duration increase in one finishing block OR one activity-appropriate speed change, not both. For example, 5 before + 10 after may become 5 + 12, then 5 + 15 in separate later reviews only if new evidence supports each step. These are conditional examples, not calendar milestones or mandatory targets. If the request prefers alternating days, maintain shorter cardio on some training days and 20 minutes on selected others; this does not mean interval training. Check all days sharing a routine before changing it. If completion or reported tolerance worsens, hold or propose a smaller prescription consistent with the requested total; explain conflicts or stated limitations. Do not use strength stall counters for cardio.

Use a cardio change for an EXISTING cardio entry, or add-exercise with mode: "cardio", sets: 1, min, speed, prog: "off" and position for a new distinct activity. The add-exercise path preserves cardio min/speed. Changes cannot target an exercise added by another change in this response. The same exercise id cannot occur twice in one routine. If the requested split or alternate-day assignment cannot be expressed with existing ids/routines, request a complete revised plan rather than claiming unsupported scheduling. State that progression is a proposal awaiting acceptance, not a guaranteed scheduled increase.

## Output

If no supported change is warranted:

```
{ "coach_contract": 1, "nochange": true, "reading": "<what the evidence shows and what to watch next>" }
```

Otherwise:

```
{
  "coach_contract": 1,
  "summary": "<what changes and why>",
  "evidence": { "from": "<first supplied date>", "to": "<last supplied date>", "sessions": 3 },
  "changes": [
    {
      "id": "c1",
      "type": "<allowed type>",
      "target": { "routineId": "<existing id>", "exId": "<existing id>" },
      "before": "<actual current value>",
      "after": "<value of the type required below>",
      "why": "<specific evidence and intended effect>"
    }
  ],
  "notes": ["<advice or constraint needing no supported change>"]
}
```

Use actual dates/counts and correctly typed before/after values; example strings/counts are placeholders. Only include target fields relevant to the type. Do not claim a change was applied.

| type | target | after |
|---|---|---|
| add-exercise | routineId | { id, sets, mode, reps or sec or (min and speed), prog?, repsMin?, repsMax?, side?, bodyweight?, weight?, position? } |
| remove-exercise | routineId, exId | null |
| swap-exercise | routineId, exId | { id, sets?, reps?, weight? } |
| sets | routineId, exId | integer 1–10 |
| reps | routineId, exId | integer 1–100 |
| repsMin | routineId, exId | integer 1–100 |
| repsMax | routineId, exId | integer 1–100, not below repsMin |
| sec | routineId, exId | integer 5–3600 |
| cardio | routineId, exId | { min?, speed? } with minutes 1–180 and positive speed at most 60 |
| reorder | routineId | every existing exId exactly once, reordered |
| superset | routineId, exId | { link: true, with: "<existing different exId>" } or { link: false } |
| routine-prog | routineId | compatible policy name |
| exercise-prog | routineId, exId | compatible policy name |
| inc | routineId, exId | known positive increment, at most 50 |
| add-routine | — | { name, emoji?, prog?, ex: [...] } |
| remove-routine | routineId | null |
| rename-routine | routineId | new name |
| week | weekday | existing routine id, "rest", or null |

A week change replaces that day's assignment with ONE existing routine, rest or null. It cannot build a combined day or point at a newly added routine. If the existing day is combined, do not silently discard its other work.

A swap preserves unspecified prescription fields. Avoid swaps between incompatible logging modes or those that would carry inappropriate loads/ranges; request a complete revised plan when a safe atomic change cannot be represented. Omit unsupported fields rather than assuming they survive. Starting weight is permitted only for an added/swapped exercise with a baseline for that exact id; never for an existing exercise.

## Final consistency check

Mentally apply supported proposals and check days, availability, exclusions, direct muscle targets, time, movement matching, appropriate difficulty, equipment preference and cardio. Preserve these constraints even though the review validator does not enforce all creation-profile checks. Do not remove routines still scheduled without a supported reassignment, create duplicate exercises or make interdependent changes that silently break if accepted separately. When the change-set cannot express a coherent adjustment, return an honest explanation and request a complete plan revision.
