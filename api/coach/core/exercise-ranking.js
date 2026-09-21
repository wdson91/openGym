// Editorial execution-complexity ranking, not load, injury risk or a medical rating.
// Explicit catalogue ids keep equipment names from masquerading as difficulty.
// Unknown entries stay unclassified until reviewed; never infer "easy" from machine.
const groups = [
  [1, 'chest_press', ['0577', '0576']],
  [2, 'chest_press', ['0289', '0314', '0662']],
  [2, 'chest_fly', ['0308']],
  [1, 'triceps_extension', ['0201', '0200', '0241']],
  [2, 'triceps_extension', ['2188', '0351', '0333']],
  [1, 'horizontal_pull', ['1350', '0588', '0861']],
  [2, 'horizontal_pull', ['0293']],
  [1, 'vertical_pull', ['0198', '0579']],
  [2, 'vertical_pull', ['0017']],
  [1, 'elbow_flexion', ['0294', '0313']],
  [2, 'elbow_flexion', ['0031']],
  [1, 'shoulder_press', ['0603']],
  [2, 'shoulder_press', ['0405']],
  [2, 'shoulder_abduction', ['0334']],
  [1, 'hip_abduction', ['0597']],
  [1, 'hip_adduction', ['0598']],
  [1, 'knee_extension', ['0585']],
  [1, 'knee_flexion', ['0599', '0586']],
  [1, 'leg_press', ['0739']],
  [2, 'squat', ['1760']],
  [2, 'lunge', ['0336']],
  [2, 'hip_hinge', ['1459']],
  [3, 'split_squat', ['0410', '0099', '0809']],
  [1, 'calf_raise', ['0594', '0605']],
  [2, 'calf_raise', ['0417']],
  [1, 'trunk_flexion', ['0274']],
  [1, 'cardio', ['2138', '0798', '3666']],
  [3, 'triceps_extension', ['1734', '1742']],
  [3, 'chest_press', ['3294']],
];

export const EXERCISE_RANKING = Object.freeze(Object.fromEntries(groups.flatMap(
  ([difficulty, movement, ids]) => ids.map(id => [id, Object.freeze({ difficulty, movement })])
)));
const UNKNOWN = Object.freeze({ difficulty: null, movement: null });
export const rankingOf = id => EXERCISE_RANKING[id] || UNKNOWN;
