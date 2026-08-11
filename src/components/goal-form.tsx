import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { DateTimeField } from '@/components/ui/date-time-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeRelative, formatDateTime, reminderDateFor } from '@/lib/dates';
import { REMINDER_OPTIONS } from '@/lib/goals';
import type { GoalDraft } from '@/lib/types';

type Props = {
  initial?: GoalDraft;
  submitLabel: string;
  onSubmit: (draft: GoalDraft) => Promise<void>;
  onDelete?: () => void;
};

const TITLE_MAX = 80;

function defaultDeadline(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
}

export function GoalForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const theme = useTheme();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [deadline, setDeadline] = useState<Date>(
    initial ? new Date(initial.deadline) : defaultDeadline(),
  );
  const [remindDaysBefore, setRemindDaysBefore] = useState<number | null>(
    initial ? initial.remindDaysBefore : 1,
  );
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Reading the clock during render is impure, so it lives in state and ticks
  // on a timer — which also keeps the "already in the past" warning honest
  // while the form sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const titleError = title.trim().length === 0 ? 'Başlık zorunlu.' : null;
  const deadlineError = deadline.getTime() <= now ? 'Deadline gelecekte bir tarih olmalı.' : null;

  const reminderDate = useMemo(
    () => reminderDateFor(deadline.toISOString(), remindDaysBefore),
    [deadline, remindDaysBefore],
  );
  const reminderInPast = reminderDate !== null && reminderDate.getTime() <= now;

  const canSubmit = !titleError && !deadlineError && !submitting;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.toISOString(),
        remindDaysBefore,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (message: string | null) => (touched && message ? message : null);

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Başlık *</Text>
          <TextInput
            maxLength={TITLE_MAX}
            onBlur={() => setTouched(true)}
            onChangeText={setTitle}
            placeholder="Örn. 30 dakika koşu"
            placeholderTextColor={theme.textTertiary}
            returnKeyType="next"
            style={inputStyle}
            value={title}
          />
          {showError(titleError) ? (
            <Text style={[styles.error, { color: theme.danger }]}>{titleError}</Text>
          ) : (
            <Text style={[styles.hint, { color: theme.textTertiary }]}>
              {title.length}/{TITLE_MAX}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Açıklama</Text>
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="İstersen kısa bir not ekle"
            placeholderTextColor={theme.textTertiary}
            style={[...inputStyle, styles.textarea]}
            value={description}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Deadline *</Text>
          <DateTimeField onChange={setDeadline} value={deadline} />
          {showError(deadlineError) ? (
            <Text style={[styles.error, { color: theme.danger }]}>{deadlineError}</Text>
          ) : (
            <Text style={[styles.hint, { color: theme.textTertiary }]}>
              {formatDateTime(deadline)} · {describeRelative(deadline, new Date(now))}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Hatırlatma</Text>
          <View style={styles.chips}>
            {REMINDER_OPTIONS.map((option) => {
              const selected = option.value === remindDaysBefore;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option.label}
                  onPress={() => setRemindDaysBefore(option.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.accent : theme.surfaceMuted,
                      borderColor: selected ? theme.accent : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: selected ? theme.onAccent : theme.textSecondary },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {reminderDate ? (
            reminderInPast ? (
              <Text style={[styles.error, { color: theme.danger }]}>
                Bu hatırlatma zamanı geçmişte kalıyor, bildirim planlanamaz. Daha ileri bir deadline
                seç veya hatırlatmayı yaklaştır.
              </Text>
            ) : (
              <Text style={[styles.hint, { color: theme.accent }]}>
                🔔 Bildirim: {formatDateTime(reminderDate)} ·{' '}
                {describeRelative(reminderDate, new Date(now))}
              </Text>
            )
          ) : (
            <Text style={[styles.hint, { color: theme.textTertiary }]}>
              Bu goal için bildirim planlanmayacak.
            </Text>
          )}
        </View>

        <Button
          label={submitLabel}
          loading={submitting}
          onPress={handleSubmit}
          style={styles.submit}
        />

        {onDelete ? (
          <Button label="Goal'ı sil" onPress={onDelete} variant="danger" />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  content: {
    gap: Spacing.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  submit: {
    marginTop: Spacing.sm,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
