import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { openSystemSettings, type PermissionState } from '@/lib/notifications';

type Props = {
  permission: PermissionState;
  /** True when at least one goal is relying on a reminder. */
  hasReminders: boolean;
  onRequest: () => void;
};

/**
 * Only worth showing once the user has actually asked for a reminder — nagging
 * about permissions on an empty list is noise.
 */
export function PermissionBanner({ permission, hasReminders, onRequest }: Props) {
  const theme = useTheme();
  if (permission === 'granted' || !hasReminders) return null;

  const denied = permission === 'denied';

  return (
    <View style={[styles.banner, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
      <Text style={[styles.title, { color: theme.warning }]}>Bildirimler kapalı</Text>
      <Text style={[styles.body, { color: theme.text }]}>
        {denied
          ? 'Hatırlatmaların gelmesi için bildirim iznini telefon ayarlarından açman gerekiyor.'
          : 'Hatırlatmaları planlayabilmemiz için bildirim izni vermen gerekiyor.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={denied ? openSystemSettings : onRequest}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.actionLabel, { color: theme.warning }]}>
          {denied ? 'Ayarları aç' : 'İzin ver'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  banner: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    padding: Spacing.lg,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});
