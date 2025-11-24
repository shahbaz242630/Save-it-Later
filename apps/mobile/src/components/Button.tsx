import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { backgroundColor: string; textColor: string; borderColor?: string }> = {
  primary: { backgroundColor: '#2563eb', textColor: '#fff' },
  secondary: { backgroundColor: '#e2e8f0', textColor: '#0f172a' },
  danger: { backgroundColor: '#dc2626', textColor: '#fff' },
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const { backgroundColor, textColor } = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
});
