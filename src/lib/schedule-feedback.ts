import { Alert } from 'react-native';

import { formatDateTime } from './dates';
import { openSystemSettings, type ScheduleOutcome } from './notifications';

/**
 * Explains why a goal was saved without a working reminder. Success and
 * "no reminder wanted" stay silent — the list already shows the bell state.
 */
export function announceScheduleOutcome(outcome: ScheduleOutcome): void {
  if (outcome.status === 'past') {
    Alert.alert(
      'Hatırlatma kurulamadı',
      `Hesaplanan hatırlatma zamanı (${formatDateTime(outcome.fireDate)}) geçmişte kaldığı için bildirim planlanmadı. Goal kaydedildi; hatırlatma istiyorsan deadline'ı ileri al veya hatırlatmayı yaklaştır.`,
    );
    return;
  }

  if (outcome.status === 'denied') {
    Alert.alert(
      'Bildirim izni yok',
      'Goal kaydedildi ama bildirim izni verilmediği için hatırlatma planlanamadı. İzni telefon ayarlarından açabilirsin.',
      [
        { text: 'Şimdi değil', style: 'cancel' },
        { text: 'Ayarları aç', onPress: openSystemSettings },
      ],
    );
  }
}
