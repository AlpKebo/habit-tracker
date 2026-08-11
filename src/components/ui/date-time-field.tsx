import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatTime } from '@/lib/dates';

type Props = {
  value: Date;
  onChange: (next: Date) => void;
};

function combine(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
}

/**
 * Date + time in one control. Android gets the platform dialogs chained
 * (date, then time); iOS renders the two compact pickers inline.
 */
export function DateTimeField({ value, onChange }: Props) {
  const theme = useTheme();

  const openAndroidPickers = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            onChange(combine(pickedDate, pickedTime));
          },
        });
      },
    });
  };

  if (Platform.OS === 'android') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Deadline tarihi ve saati seç"
        onPress={openAndroidPickers}
        style={({ pressed }) => [
          styles.androidField,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <Text style={[styles.androidValue, { color: theme.text }]}>{formatDate(value)}</Text>
        <Text style={[styles.androidValue, { color: theme.accent }]}>{formatTime(value)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.inlineRow}>
      <DateTimePicker
        accessibilityLabel="Deadline tarihi"
        display="compact"
        mode="date"
        onChange={(_event, picked) => picked && onChange(combine(picked, value))}
        value={value}
      />
      <DateTimePicker
        accessibilityLabel="Deadline saati"
        display="compact"
        mode="time"
        onChange={(_event, picked) => picked && onChange(combine(value, picked))}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  androidField: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
  },
  androidValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
