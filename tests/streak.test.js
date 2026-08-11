/**
 * Streak logic checks, including the reset-after-an-empty-day case that cannot
 * be observed on a device without waiting for a calendar day to pass.
 *
 * Run with: npm run test:streak
 * The npm script compiles the pure modules from src/lib into .test-build first,
 * so this file stays plain JS and the project needs no test framework.
 */
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  computeStreak,
  addCompletionDay,
  removeCompletionDayIfUnused,
} = require('../.test-build/streak');

test('brief scenario: Mon and Tue done, Wed empty, Thu done', async (t) => {
  await t.test('Monday starts the streak', () => {
    assert.deepEqual(computeStreak(['2026-08-03'], '2026-08-03'), {
      currentStreak: 1,
      bestStreak: 1,
      lastCompletionDate: '2026-08-03',
    });
  });

  await t.test('Tuesday extends it', () => {
    assert.deepEqual(computeStreak(['2026-08-03', '2026-08-04'], '2026-08-04'), {
      currentStreak: 2,
      bestStreak: 2,
      lastCompletionDate: '2026-08-04',
    });
  });

  // Rule 4 requires a *whole* day to pass empty, so Wednesday itself is still a
  // grace day: the streak is at risk but not yet broken.
  await t.test('Wednesday in progress leaves the streak at risk, not broken', () => {
    assert.deepEqual(computeStreak(['2026-08-03', '2026-08-04'], '2026-08-05'), {
      currentStreak: 2,
      bestStreak: 2,
      lastCompletionDate: '2026-08-04',
    });
  });

  await t.test('once Wednesday has passed empty, the streak resets to 0', () => {
    assert.deepEqual(computeStreak(['2026-08-03', '2026-08-04'], '2026-08-06'), {
      currentStreak: 0,
      bestStreak: 2,
      lastCompletionDate: '2026-08-04',
    });
  });

  await t.test('Thursday starts a new streak and the best is kept', () => {
    assert.deepEqual(computeStreak(['2026-08-03', '2026-08-04', '2026-08-06'], '2026-08-06'), {
      currentStreak: 1,
      bestStreak: 2,
      lastCompletionDate: '2026-08-06',
    });
  });
});

test('edge cases', async (t) => {
  await t.test('no completions at all', () => {
    assert.deepEqual(computeStreak([], '2026-08-11'), {
      currentStreak: 0,
      bestStreak: 0,
      lastCompletionDate: null,
    });
  });

  await t.test('a completion yesterday keeps the streak alive today', () => {
    assert.deepEqual(computeStreak(['2026-08-09', '2026-08-10'], '2026-08-11'), {
      currentStreak: 2,
      bestStreak: 2,
      lastCompletionDate: '2026-08-10',
    });
  });

  await t.test('two completions on one day count once', () => {
    const days = addCompletionDay(addCompletionDay([], '2026-08-11'), '2026-08-11');
    assert.deepEqual(days, ['2026-08-11']);
    assert.equal(computeStreak(days, '2026-08-11').currentStreak, 1);
  });

  await t.test('unsorted input is handled', () => {
    assert.equal(
      computeStreak(['2026-08-11', '2026-08-09', '2026-08-10'], '2026-08-11').currentStreak,
      3,
    );
  });

  await t.test('the best streak survives a later, shorter run', () => {
    assert.deepEqual(
      computeStreak(
        ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-08-10', '2026-08-11'],
        '2026-08-11',
      ),
      { currentStreak: 2, bestStreak: 4, lastCompletionDate: '2026-08-11' },
    );
  });

  await t.test('days either side of a month boundary are consecutive', () => {
    assert.equal(computeStreak(['2026-07-31', '2026-08-01'], '2026-08-01').currentStreak, 2);
  });

  await t.test('a long gap resets to zero but keeps the best', () => {
    assert.deepEqual(computeStreak(['2026-01-01', '2026-01-02', '2026-01-03'], '2026-08-11'), {
      currentStreak: 0,
      bestStreak: 3,
      lastCompletionDate: '2026-01-03',
    });
  });
});

test('undo removes a day only when nothing is left on it', async (t) => {
  await t.test('another completion on the same day keeps the day', () => {
    const goals = [
      { id: 'a', completed: false, completedAt: null },
      { id: 'b', completed: true, completedAt: new Date(2026, 7, 11, 10, 0).toISOString() },
    ];
    assert.deepEqual(removeCompletionDayIfUnused(['2026-08-11'], '2026-08-11', goals), [
      '2026-08-11',
    ]);
  });

  await t.test('the last completion of the day drops the day', () => {
    const goals = [{ id: 'a', completed: false, completedAt: null }];
    assert.deepEqual(
      removeCompletionDayIfUnused(['2026-08-10', '2026-08-11'], '2026-08-11', goals),
      ['2026-08-10'],
    );
  });
});
