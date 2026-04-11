import { Pressable, StyleSheet, Text, ViewStyle, type StyleProp } from 'react-native';
import { colors, fonts } from '../styles/theme';

type ActionButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'ghost';
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function ActionButton({
  accessibilityLabel,
  disabled = false,
  kind = 'primary',
  label,
  onPress,
  style,
  testID,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && kind === 'primary' && styles.primaryPressed,
        pressed && !disabled && kind !== 'primary' && styles.secondaryPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          kind === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.45,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: '#fff7ef',
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryLabel: {
    color: colors.accent,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});