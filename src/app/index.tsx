import { Link, Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalCard } from '@/components/goal-card';
import { PermissionBanner } from '@/components/permission-banner';
import { StreakCard } from '@/components/streak-card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { groupGoals } from '@/lib/goals';
import { useGoals } from '@/lib/goals-store';
import type { Goal } from '@/lib/types';

type Section = { title: string; data: Goal[] };

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    ready,
    goals,
    streak,
    todayCompletions,
    completedToday,
    permission,
    askPermission,
    toggleComplete,
  } = useGoals();

  const sections = useMemo<Section[]>(() => {
    const grouped = groupGoals(goals);
    return [
      { title: 'Gecikmiş', data: grouped.overdue },
      { title: 'Aktif', data: grouped.active },
      { title: 'Tamamlanan', data: grouped.completed },
    ].filter((section) => section.data.length > 0);
  }, [goals]);

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
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz goal yok</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              İlk hedefini ekle, deadline ver ve hatırlatmayı kur. Her gün en az bir goal
              tamamladığında serin büyümeye başlar.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <StreakCard
              completedToday={completedToday}
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
          <GoalCard
            goal={item}
            onPress={() => router.push(`/goal/${item.id}`)}
            onToggle={() => void toggleComplete(item.id)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textTertiary }]}>
              {section.data.length}
            </Text>
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
    fontSize: 44,
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
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
