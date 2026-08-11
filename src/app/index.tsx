import { Link, Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalCard } from '@/components/goal-card';
import { PermissionBanner } from '@/components/permission-banner';
import { StreakCard } from '@/components/streak-card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { groupGoals } from '@/lib/goals';
import { useGoals } from '@/lib/goals-store';
import type { Goal } from '@/lib/types';

type Section = { title: string; accent: string; data: Goal[] };

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    ready,
    goals,
    streak,
    completionDays,
    todayCompletions,
    completedToday,
    permission,
    askPermission,
    toggleComplete,
    deleteGoal,
  } = useGoals();

  const confirmDelete = (goal: Goal) => {
    Alert.alert('Goal silinsin mi?', `“${goal.title}” kalıcı olarak silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteGoal(goal.id) },
    ]);
  };

  const sections = useMemo<Section[]>(() => {
    const grouped = groupGoals(goals);
    return [
      { title: 'Gecikmiş', accent: theme.danger, data: grouped.overdue },
      { title: 'Aktif', accent: theme.accent, data: grouped.active },
      { title: 'Tamamlanan', accent: theme.success, data: grouped.completed },
    ].filter((section) => section.data.length > 0);
  }, [goals, theme.accent, theme.danger, theme.success]);

  const hasReminders = goals.some((goal) => !goal.completed && goal.remindDaysBefore !== null);

  if (!ready) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link asChild href="/goal/new">
              <Pressable
                accessibilityLabel="Yeni goal ekle"
                accessibilityRole="button"
                hitSlop={12}
                style={({ pressed }) => [styles.headerAdd, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[styles.headerAddLabel, { color: theme.accent }]}>＋</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      <SectionList
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
              <Text style={styles.emptyEmoji}>🎯</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz goal yok</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              İlk hedefini ekle, deadline ver ve hatırlatmayı kur. Her gün en az bir goal
              tamamladığında serin büyümeye başlar.
            </Text>
            <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
              Aşağıdaki butondan başla ↓
            </Text>
          </View>
        }
        ListFooterComponent={
          goals.length > 0 ? (
            <Text style={[styles.swipeHint, { color: theme.textTertiary }]}>
              İpucu: karta sağa kaydır → tamamla · sola kaydır → sil
            </Text>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <StreakCard
              completedToday={completedToday}
              completionDays={completionDays}
              streak={streak}
              todayCompletions={todayCompletions}
            />
            <PermissionBanner
              hasReminders={hasReminders}
              onRequest={() => void askPermission()}
              permission={permission}
            />
          </View>
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 96 },
          sections.length === 0 && styles.listEmpty,
        ]}
        keyExtractor={(goal) => goal.id}
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.springify().damping(18)}>
            <GoalCard
              goal={item}
              onDelete={() => confirmDelete(item)}
              onPress={() => router.push(`/goal/${item.id}`)}
              onToggle={() => void toggleComplete(item.id)}
            />
          </Animated.View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: section.accent }]} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCount, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.sectionCountText, { color: theme.textSecondary }]}>
                {section.data.length}
              </Text>
            </View>
          </View>
        )}
        sections={sections}
        stickySectionHeadersEnabled={false}
      />

      {/* box-none so the bar itself never swallows taps meant for the list. */}
      <View
        pointerEvents="box-none"
        style={[styles.fabBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Link asChild href="/goal/new">
          <Pressable
            accessibilityLabel="Yeni goal ekle"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.accent, opacity: pressed ? 0.9 : 1 },
            ]}>
            <Text style={[styles.fabLabel, { color: theme.onAccent }]}>+ Yeni goal</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 88,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 88,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fab: {
    borderRadius: Radius.pill,
    elevation: 4,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  fabBar: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  fabLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerAdd: {
    paddingHorizontal: Spacing.sm,
  },
  headerAddLabel: {
    fontSize: 24,
    fontWeight: '700',
  },
  header: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  list: {
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  screen: {
    flex: 1,
  },
  sectionAccent: {
    borderRadius: Radius.pill,
    height: 14,
    width: 3,
  },
  sectionCount: {
    borderRadius: Radius.pill,
    minWidth: 22,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  swipeHint: {
    fontSize: 12,
    paddingTop: Spacing.md,
    textAlign: 'center',
  },
});
