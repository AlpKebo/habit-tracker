import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GoalForm } from '@/components/goal-form';
import { useTheme } from '@/hooks/use-theme';
import { useGoals } from '@/lib/goals-store';
import { announceScheduleOutcome } from '@/lib/schedule-feedback';

export default function NewGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { createGoal } = useGoals();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <GoalForm
        onSubmit={async (draft) => {
          const outcome = await createGoal(draft);
          router.back();
          announceScheduleOutcome(outcome);
        }}
        submitLabel="Goal'ı kaydet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
