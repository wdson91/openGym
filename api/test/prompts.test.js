/* The generated prompt module is what both runtimes read; the .md files are what people edit.
 * If they disagree, a prompt change silently never reaches the model. The generator's --check
 * makes the same assertion in CI; this one fails faster, inside the unit suite. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { PROMPTS } = await import('../coach/core/prompts.js');
const { buildPrompt } = await import('../coach/core/prompt.js');
const { validatePlan, CHANGE_TYPES } = await import('../coach/core/validate.js');
const { POLICIES_FOR, DELOAD_AFTER } = await import('../../frontend/src/lib/progression.js');
const { rankingOf } = await import('../coach/core/exercise-ranking.js');
const { LIB_BY_ID } = await import('../coach/core/library.js');

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'coach', 'prompts');

test('core/prompts.js matches api/coach/prompts/*.md byte for byte', () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  assert.deepEqual(Object.keys(PROMPTS).sort(), files.map(f => f.replace(/\.md$/, '')));
  for (const f of files) {
    assert.equal(PROMPTS[f.replace(/\.md$/, '')], fs.readFileSync(path.join(dir, f), 'utf8'), `${f} is stale — run node scripts/build-coach-assets.mjs`);
  }
});

test('buildPrompt picks the task by kind and refine, and only adds the repair block when asked', () => {
  const payload = { coach_contract: 1, plan: { routines: [], week: {} } };
  const review = buildPrompt('review', payload, null);
  assert.ok(review.startsWith(PROMPTS.common));
  assert.ok(review.includes(PROMPTS.review));
  assert.ok(!review.includes(PROMPTS.repair.slice(0, 40)));

  const debrief = buildPrompt('debrief', payload, null);
  assert.ok(debrief.includes(PROMPTS.debrief) && !debrief.includes(PROMPTS.review) && !debrief.includes(PROMPTS.create));

  const create = buildPrompt('create', payload, null);
  assert.ok(create.includes(PROMPTS.create) && !create.includes(PROMPTS.refine));
  const refine = buildPrompt('create', { ...payload, refine: { text: 'x' } }, null);
  assert.ok(refine.includes(PROMPTS.refine) && !refine.includes(PROMPTS.create));

  const repaired = buildPrompt('review', payload, { previous: '{"bad": true}', errors: ['first', 'second'] });
  assert.ok(repaired.includes('{"bad": true}'));
  assert.ok(repaired.includes('- first\n- second'));
  assert.ok(!repaired.includes('{{PREVIOUS}}') && !repaired.includes('{{ERRORS}}'));
});

test('creation examples form a valid plan with a real rep range and cardio override', () => {
  const examples = [...PROMPTS.create.matchAll(/```\n(\{[^\n]+\})\n```/g)]
    .map(m => JSON.parse(m[1]));
  assert.equal(examples.length, 2);
  const [strength, cardio] = examples;
  strength.id = '0289';
  cardio.id = '2138';
  assert.ok(strength.repsMin < strength.reps, 'the example must not collapse double progression to fixed reps');
  assert.equal(strength.repsMax, undefined, 'bodyweight ceiling is not the loaded rep-range ceiling');
  assert.equal(strength.inc, undefined, 'unknown equipment increments are not invented');
  assert.equal(strength.sg, undefined, 'no accidental singleton superset');
  for (const e of examples) assert.ok(POLICIES_FOR[e.mode].includes(e.prog));
  const result = validatePlan({
    name: 'Example', week: { 1: 'r1' },
    routines: [{ id: 'r1', name: 'Example', prog: 'double', ex: examples }]
  });
  assert.equal(result.ok, true);
  assert.equal(result.bundle.routines[0].ex[1].prog, 'off');
  assert.equal(result.bundle.routines[0].ex[1].min, 10);
});

test('review exposes exactly the action types the validator supports', () => {
  const types = [...PROMPTS.review.matchAll(/^\| ([a-z][a-zA-Z-]+) \|/gm)]
    .map(m => m[1]).filter(t => t !== 'type');
  assert.deepEqual(types.sort(), [...CHANGE_TYPES].sort());
  assert.match(PROMPTS.review, /add-exercise path preserves cardio min\/speed/);
});

test('review respects the engine thresholds instead of auto-swapping on two coarse stalls', () => {
  assert.deepEqual(DELOAD_AFTER, { linear: 3, greyskull: 1, double: 3, time: 3 });
  assert.match(PROMPTS.common, /linear\/double\/time use three misses; Greyskull uses one/);
  assert.match(PROMPTS.review, /stalls >= 2 as a reason to inspect, not an automatic swap\/cut/);
  assert.match(PROMPTS.common, /NOT the engine's complete policy-specific decision/);
});

test('refinement is self-contained and debrief does not require a personal record', () => {
  const refine = buildPrompt('create', { refine: { previous: {}, text: 'Use dumbbells' } });
  for (const field of ['coach_contract: 1', 'opengym_plan: 1', 'customEx: []', 'weekday-number', 'repsMin', 'focus']) {
    assert.ok(PROMPTS.refine.includes(field), `refine must specify ${field} without relying on create.md`);
  }
  assert.ok(!refine.includes(PROMPTS.create));
  assert.match(PROMPTS.debrief, /high score does not require a PR or heavier weight/);
});

test('first-plan examples are actually level 1 and both generation paths enforce that scope', () => {
  const table = PROMPTS.common.split('| Target | Level-1 starting candidates |')[1].split('\n\n')[0];
  const ids = table.match(/\b\d{4}\b/g);
  assert.ok(ids.length >= 15, 'check the actual recommended starting catalogue');
  for (const id of ids) {
    assert.ok(LIB_BY_ID.has(id), id);
    assert.equal(rankingOf(id).difficulty, 1, `${id} must not quietly anchor a harder first plan`);
  }
  for (const task of ['create', 'refine']) {
    assert.match(PROMPTS[task], /difficulty: 1/);
    assert.match(PROMPTS[task], /approved.*division/);
  }
  assert.match(PROMPTS.common, /unclassified \(null\) entries/);
  assert.match(PROMPTS.common, /Lower weight or two sets does not turn a harder movement into a level-1 exercise/);
  assert.match(PROMPTS.common, /sets: 3/);
  assert.match(PROMPTS.common, /do not prescribe 2 sets/i);
  for (const task of ['create', 'refine']) {
    assert.match(PROMPTS[task], /sets: 3/);
  }
});
