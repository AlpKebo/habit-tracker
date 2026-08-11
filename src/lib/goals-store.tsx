import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { toDayKey } from './dates';
import {
  cancelReminder,
  ensureAndroidChannel,
  getPermissionState,
  pruneOrphanedReminders,
  requestPermission,
  rescheduleReminder,
  scheduleReminder,
  type PermissionState,
  type ScheduleOutcome,
} from './notifications';
import { EMPTY_STATE, loadState, saveState } from './storage';
import {
  addCompletionDay,
  completionsOn,
  computeStreak,
  removeCompletionDayIfUnused,
} from './streak';
import type { Goal, GoalDraft, PersistedState, Streak } from './types';

type GoalsContextValue = {
  /** False until the first read from AsyncStorage lands. */
  ready: boolean;
  goals: Goal[];
  streak: Streak;
  /** How many goals were ticked off today — shown next to the streak. */
  todayCompletions: number;
  /** True once today counts towards the streak, so the UI can warn when it does not. */
  completedToday: boolean;
  permission: PermissionState;
  askPermission: () => Promise<PermissionState>;
  refreshPermission: () => Promise<void>;
  createGoal: (draft: GoalDraft) => Promise<ScheduleOutcome>;
  updateGoal: (id: string, draft: GoalDraft) => Promise<ScheduleOutcome>;
  deleteGoal: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  // Mutations are user-driven and sequential, so a ref is a safer source of
  // truth than a stale closure over `state`. Every writer below updates the ref
  // alongside setState, so it never needs syncing during render.
  const stateRef = useRef(state);

  const commit = useCallback(async (next: PersistedState) => {
    const withStreak: PersistedState = { ...next, streak: computeStreak(next.completionDays) };
    stateRef.current = withStreak;
    setState(withStreak);
    await saveState(withStreak);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Startup must never leave the app stuck on the loading spinner: if
      // storage or the notification module fails, fall back to an empty state
      // so the user can still add goals.
      let loaded = EMPTY_STATE;
      try {
        loaded = await loadState();
      } catch (error) {
        console.warn('Kayıtlı veri okunamadı, boş state ile başlatılıyor.', error);
      }
      if (cancelled) return;
      stateRef.current = loaded;
      setState(loaded);
      setReady(true);

      try {
        setPermission(await getPermissionState());
        await ensureAndroidChannel();
        await pruneOrphanedReminders(loaded.goals);
      } catch (error) {
        console.warn('Bildirim başlangıç kontrolü başarısız.', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Coming back from the background can mean a new calendar day: recheck both
  // the streak and the permission the user may have flipped in Settings.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      void (async () => {
        setPermission(await getPermissionState());
        const current = stateRef.current;
        const streak = computeStreak(current.completionDays);
        if (
          streak.currentStreak !== current.streak.currentStreak ||
          streak.bestStreak !== current.streak.bestStreak
        ) {
          const next = { ...current, streak };
          stateRef.current = next;
          setState(next);
        }
      })();
    });
    return () => subscription.remove();
  }, []);

  const askPermission = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, []);

  const refreshPermission = useCallback(async () => {
    setPermission(await getPermissionState());
  }, []);

  const createGoal = useCallback(
    async (draft: GoalDraft) => {
      const outcome = await scheduleReminder(draft);
      await refreshPermission();

      const now = new Date().toISOString();
      const goal: Goal = {
        id: makeId(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        deadline: draft.deadline,
        remindDaysBefore: draft.remindDaysBefore,
        notificationId: outcome.status === 'scheduled' ? outcome.notificationId : null,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await commit({ ...stateRef.current, goals: [...stateRef.current.goals, goal] });
      return outcome;
    },
    [commit, refreshPermission],
  );

  const updateGoal = useCallback(
    async (id: string, draft: GoalDraft) => {
      const previous = stateRef.current.goals.find((g) => g.id === id) ?? null;
      // A completed goal has no live reminder and should not gain one on edit.
      const outcome = previous?.completed
        ? ({ status: 'no-reminder' } as ScheduleOutcome)
        : await rescheduleReminder(previous, draft);
      await refreshPermission();

      const goals = stateRef.current.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              title: draft.title.trim(),
              description: draft.description.trim(),
              deadline: draft.deadline,
              remindDaysBefore: draft.remindDaysBefore,
              notificationId: outcome.status === 'scheduled' ? outcome.notificationId : null,
              updatedAt: new Date().toISOString(),
            }
          : goal,
      );

      await commit({ ...stateRef.current, goals });
      return outcome;
    },
    [commit, refreshPermission],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const target = stateRef.current.goals.find((goal) => goal.id === id);
      await cancelReminder(target?.notificationId ?? null);
      // The completion ledger is intentionally left alone: deleting an old goal
      // should not rewrite a streak the user already earned.
      await commit({
        ...stateRef.current,
        goals: stateRef.current.goals.filter((goal) => goal.id !== id),
      });
    },
    [commit],
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      const target = stateRef.current.goals.find((goal) => goal.id === id);
      if (!target) return;

      if (!target.completed) {
        await cancelReminder(target.notificationId);
        const completedAt = new Date();
        const goals = stateRef.current.goals.map((goal) =>
          goal.id === id
            ? {
                ...goal,
                completed: true,
                completedAt: completedAt.toISOString(),
                notificationId: null,
                updatedAt: completedAt.toISOString(),
              }
            : goal,
        );
        await commit({
          ...stateRef.current,
          goals,
          completionDays: addCompletionDay(stateRef.current.completionDays, toDayKey(completedAt)),
        });
        return;
      }

      // Undo: put the goal back on the active list and restore its reminder.
      const undoneDay = target.completedAt ? toDayKey(new Date(target.completedAt)) : null;
      const outcome = await scheduleReminder(target);
      const goals = stateRef.current.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              completed: false,
              completedAt: null,
              notificationId: outcome.status === 'scheduled' ? outcome.notificationId : null,
              updatedAt: new Date().toISOString(),
            }
          : goal,
      );
      const completionDays = undoneDay
        ? removeCompletionDayIfUnused(stateRef.current.completionDays, undoneDay, goals)
        : stateRef.current.completionDays;

      await commit({ ...stateRef.current, goals, completionDays });
    },
    [commit],
  );

  const { todayCompletions, completedToday } = useMemo(() => {
    const today = toDayKey(new Date());
    return {
      todayCompletions: completionsOn(state.goals, today),
      // Read off the ledger rather than the goal list, so deleting a goal that
      // was completed today does not make the streak look at risk.
      completedToday: state.completionDays.includes(today),
    };
  }, [state.goals, state.completionDays]);

  const value = useMemo<GoalsContextValue>(
    () => ({
      ready,
      goals: state.goals,
      streak: state.streak,
      todayCompletions,
      completedToday,
      permission,
      askPermission,
      refreshPermission,
      createGoal,
      updateGoal,
      deleteGoal,
      toggleComplete,
    }),
    [
      ready,
      state.goals,
      state.streak,
      todayCompletions,
      completedToday,
      permission,
      askPermission,
      refreshPermission,
      createGoal,
      updateGoal,
      deleteGoal,
      toggleComplete,
    ],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsContextValue {
  const context = useContext(GoalsContext);
  if (!context) throw new Error('useGoals must be used inside a GoalsProvider');
  return context;
}
