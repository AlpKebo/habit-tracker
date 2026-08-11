import * as Haptics from 'expo-haptics';

/**
 * Thin wrappers so screens never have to care that haptics are best-effort:
 * simulators and devices with the taptic engine disabled simply reject, and a
 * missing vibration should never surface as an error.
 */
const run = (effect: () => Promise<void>) => {
  effect().catch(() => {});
};

/** A goal was ticked off. */
export const tapSuccess = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** A completion was undone, or a swipe snapped back. */
export const tapLight = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** A destructive action, e.g. a delete confirmation opening. */
export const tapWarning = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
