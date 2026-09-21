import test from 'node:test';
import assert from 'node:assert/strict';
import { librarySlice, LIB_BY_ID } from '../coach/core/library.js';
import { FOUNDATION_IDS } from '../coach/core/foundations.js';
import { EXERCISE_RANKING, rankingOf } from '../coach/core/exercise-ranking.js';
import { validatePlan, validateReview } from '../coach/core/validate.js';
import { runPipeline } from '../coach/core/pipeline.js';
import { build } from '../coach/core/payload.js';
import { buildPromptParts } from '../coach/core/prompt.js';

const strength = id => ({ id, sets: 3, mode: 'reps', reps: 10 });
const cardio = { id: '2138', sets: 1, mode: 'cardio', min: 10, speed: 8, prog: 'off' };
const plan = () => ({
  coach_contract: 1, summary: 'Básicos de peito e tríceps.', week: { 1: 'a' },
  routines: [{ id: 'a', name: 'Peito e tríceps', focus: ['pectorals', 'triceps'],
    ex: ['0577', '0289', '0314', '0201', '2188', '0351'].map(strength).concat({ ...cardio }) }]
});
const profile = { daysPerWeek: 1, exercisesPerMuscle: 3, cardioDaysPerWeek: 1, cardioMinutes: 10 };
const ctx = { coachProfile: profile, daysPerWeek: 1, library: librarySlice({}, []) };

test('the default catalogue offers real, familiar options across the whole body', () => {
  const slice = librarySlice({}, []);
  for (const id of FOUNDATION_IDS) {
    assert.ok(LIB_BY_ID.has(id), `unknown foundation ${id}`);
    assert.ok(slice.some(e => e.id === id && e.foundation && e.eq && e.tg), `missing foundation ${id}`);
  }
  const dumbbells = librarySlice({}, ['dumbbell']);
  assert.ok(dumbbells.some(e => e.id === '0289'));
  assert.ok(!dumbbells.some(e => e.id === '0577'), 'preference never bypasses availability');
});

test('a paired 3 + 3 plan with actual cardio is accepted', () => {
  assert.equal(validatePlan(plan(), ctx).ok, true);
});

test('cardio duration is a session total: split blocks and alternating days are valid', () => {
  for (const [before, after] of [[5, 10], [10, 10], [5, 5]]) {
    const p = plan();
    p.routines[0].ex.unshift({ ...cardio, id: '3666', min: before });
    p.routines[0].ex[p.routines[0].ex.length - 1].min = after;
    assert.equal(validatePlan(p, ctx).ok, true, `${before} + ${after}`);
    if (before + after < 20) assert.equal(validatePlan(p, { ...ctx, coachProfile: { ...profile, cardioMinutes: 20 } }).ok, false);
  }
  const p = plan();
  p.routines.push({ ...structuredClone(p.routines[0]), id: 'b' });
  p.routines[1].ex.at(-1).min = 20;
  p.week = { 1: 'a', 2: 'b', 4: 'a' };
  assert.equal(validatePlan(p, { ...ctx, daysPerWeek: 3, coachProfile: { ...profile, cardioDaysPerWeek: 3 } }).ok, true);
});

test('cardio review preserves new block duration and applies the floor to the sum', () => {
  const p = plan();
  const add = { id: 'c1', type: 'add-exercise', target: { routineId: 'a' },
    after: { ...cardio, id: '3666', min: 5, speed: 4, position: 0 }, why: 'Requested introductory block.' };
  const checked = validateReview({ changes: [add] }, p, ctx);
  assert.equal(checked.ok, true);
  assert.equal(checked.proposal.changes[0].after.min, 5);
  assert.equal(checked.proposal.changes[0].after.speed, 4);
  assert.equal(checked.proposal.changes[0].after.position, 0);
  const change = { id: 'c2', type: 'cardio', target: { routineId: 'a', exId: '2138' }, after: { min: 5 }, why: 'Redistribute the total.' };
  assert.equal(validateReview({ changes: [change] }, p, ctx).ok, false, '5 total is too short');
  assert.equal(validateReview({ changes: [add, change] }, p, ctx).ok, true, '5 + 5 meets the floor');
  change.after.min = 12;
  assert.equal(validateReview({ changes: [change] }, p, ctx).ok, true, 'progress from 10 to 12');
  add.after.id = '0294';
  assert.equal(validateReview({ changes: [add] }, p, ctx).ok, false, 'strength cannot masquerade as cardio');
});

test('simpler classified options precede harder dumbbells without dropping requested movements', () => {
  for (const max of [60, 160, 2000]) {
    const slice = librarySlice({}, [], { max, preferredEquipment: 'dumbbell' });
    for (const [simple, harder] of [['1350', '0293'], ['0201', '0333'], ['0577', '0289']]) {
      const first = slice.findIndex(e => e.id === simple);
      const second = slice.findIndex(e => e.id === harder);
      assert.ok(first >= 0 && (second < 0 || first < second), `${simple} before ${harder}, cap ${max}`);
    }
    assert.ok(slice.some(e => e.bp === 'cardio'), 'strength preference retains cardio');
  }
  const small = librarySlice({}, [], { max: 60 });
  for (const id of ['0597', '0598', '1350', '0201', '0200']) {
    assert.ok(small.some(e => e.id === id), `${id} survives even the review catalogue cap`);
  }
  const limited = librarySlice({}, ['cable'], { preferredEquipment: 'dumbbell' });
  assert.ok(limited.every(e => e.eq === 'cable'), 'a preference cannot invent available equipment');
});

test('payload applies the saved equipment preference to the library order', () => {
  const state = { coach: { profile: { preferredEquipment: 'balanced', daysPerWeek: 3 } }, routines: [], workouts: [] };
  const balanced = build(state, { handle: 'test', kind: 'create' });
  state.coach.profile.preferredEquipment = 'dumbbell';
  const dumbbell = build(state, { handle: 'test', kind: 'create' });
  assert.notDeepEqual(balanced.library, dumbbell.library);
  assert.equal(dumbbell.library.find(e => e.bp === 'chest').difficulty, 1);
  assert.equal(dumbbell.library.find(e => e.bp === 'upper arms').eq, 'dumbbell', 'equipment preference still breaks equal-difficulty ties');
});

test('create, refine and review all carry movement-first ranking and separate cardio rules', () => {
  for (const [kind, payload] of [['create', {}], ['create', { refine: {} }], ['review', {}]]) {
    const { system } = buildPromptParts(kind, payload);
    assert.match(system, /Match movement, then difficulty, then equipment preference/);
    assert.match(system, /Six strength exercises PLUS cardio means seven entries/);
    assert.match(system, /barbell is NOT dumbbell/);
  }
});

test('ranking is explicit, valid and distinct from muscle or load', () => {
  for (const [id, rank] of Object.entries(EXERCISE_RANKING)) {
    assert.ok(LIB_BY_ID.has(id), `unknown catalogue id ${id}`);
    assert.ok([1, 2, 3].includes(rank.difficulty));
    assert.equal(typeof rank.movement, 'string');
  }
  assert.equal(rankingOf('0597').movement, 'hip_abduction');
  assert.equal(rankingOf('0598').movement, 'hip_adduction');
  assert.equal(rankingOf('1459').movement, 'hip_hinge');
  assert.equal(rankingOf('0410').movement, 'split_squat');
  assert.equal(rankingOf('0410').difficulty, 3);
  assert.equal(rankingOf('1734').difficulty, 3);
  assert.deepEqual(rankingOf('unclassified'), { difficulty: null, movement: null });
  const kept = librarySlice({}, ['dumbbell'], { keep: ['1350'] });
  assert.equal(kept[0].id, '1350');
  assert.equal(kept[0].movement, 'horizontal_pull');
  assert.equal(kept[0].difficulty, 1, 'history keeps ranking metadata');
  const custom = librarySlice({ customEx: [{ id: 'cx1', n: 'Custom', bp: 'back' }] }, [])[0];
  assert.equal(custom.difficulty, null, 'custom exercises are not presumed easy');
});

test('a time or volume excuse cannot silently remove or shorten available cardio', () => {
  const p = plan();
  p.adjustment = 'Increased strength volume to six exercises.';
  p.routines[0].ex.pop();
  assert.ok(validatePlan(p, ctx).errors.some(e => e.includes('cardio days')));
  p.routines[0].ex.push({ ...cardio, min: 5 });
  assert.ok(validatePlan(p, ctx).errors.some(e => e.includes('cardio minutes')));
});

test('explicit cardio opt-out and documented availability constraints are respected', () => {
  const p = plan();
  p.routines[0].ex.pop();
  assert.equal(validatePlan(p, { ...ctx, coachProfile: { ...profile, cardioDaysPerWeek: 0 } }).ok, true);
  const limited = { ...ctx, library: ctx.library.filter(e => e.bp !== 'cardio') };
  assert.equal(validatePlan(p, limited).ok, false, 'absence needs a visible explanation');
  p.adjustment = 'No cardio activity is available with the listed equipment.';
  assert.equal(validatePlan(p, limited).ok, true);
});

test('three total exercises and no cardio are returned for repair', () => {
  const p = plan();
  p.routines[0].ex = p.routines[0].ex.slice(0, 3);
  const result = validatePlan(p, ctx);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.includes('cardio days')));
  assert.ok(result.errors.some(e => e.includes('triceps')));
});

test('secondary muscle involvement cannot replace direct triceps work', () => {
  const p = plan();
  p.routines[0].ex = p.routines[0].ex.filter(e => !['2188', '0351'].includes(e.id));
  assert.ok(validatePlan(p, ctx).errors.some(e => e.includes('triceps needs 3')));
});

test('a concrete volume adjustment is preserved in the visible summary', () => {
  const p = plan();
  p.routines[0].ex = p.routines[0].ex.filter(e => !['2188', '0351'].includes(e.id));
  p.adjustment = 'Sessão de 30 minutos: reduzi o tríceps para manter o cardio e os descansos.';
  const result = validatePlan(p, ctx);
  assert.equal(result.ok, true);
  assert.ok(result.bundle.summary.includes(p.adjustment));
});

test('a strength exercise labelled cardio does not satisfy the request', () => {
  const p = plan();
  p.routines[0].ex[p.routines[0].ex.length - 1] = { ...cardio, id: '0294' };
  assert.equal(validatePlan(p, ctx).ok, false);
});

test('strength exercises must default to 3 sets unless justified by limitations or adjustment', () => {
  const p = plan();
  p.routines[0].ex[0].sets = 2;
  const bad = validatePlan(p, ctx);
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => e.includes('default is 3 work sets (sets: 3)')));

  p.adjustment = 'Reduzi séries do supino para 2 devido a tempo de treino.';
  const adjusted = validatePlan(p, ctx);
  assert.equal(adjusted.ok, true);

  delete p.adjustment;
  const limitedProfile = { ...profile, limitations: 'Ombro esquerdo machucado' };
  const limited = validatePlan(p, { ...ctx, coachProfile: limitedProfile });
  assert.equal(limited.ok, true);
});

test('quality failures reach the existing repair round', async () => {
  let calls = 0;
  const bad = plan();
  bad.routines[0].ex = bad.routines[0].ex.slice(0, 3);
  const result = await runPipeline({ kind: 'create', cfg: {},
    payload: { coachProfile: profile, library: ctx.library },
    adapter: { invoke: async ({ prompt }) => {
      calls++;
      if (calls === 2) assert.match(prompt, /cardio days/);
      return { code: 0, text: JSON.stringify(calls === 1 ? bad : plan()) };
    } }
  });
  assert.equal(result.ok, true);
  assert.equal(calls, 2);
});

test('legacy profiles get the new defaults and explicit cardio opt-out survives', () => {
  const state = { coach: { profile: { goal: 'muscle', daysPerWeek: 3 } }, routines: [], workouts: [] };
  const p = build(state, { handle: 'test', kind: 'create' });
  assert.equal(p.coachProfile.preferredEquipment, 'dumbbell');
  assert.equal(p.coachProfile.exercisesPerMuscle, 3);
  assert.equal(p.coachProfile.cardioDaysPerWeek, 3);
  state.coach.profile.cardioDaysPerWeek = 0;
  assert.equal(build(state, { handle: 'test', kind: 'create' }).coachProfile.cardioDaysPerWeek, 0);
});
