import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  style?: ViewStyle;
}

export function TagChip({ label, selected, onPress, count, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.default,
        pressed && onPress ? { opacity: 0.85 } : null,
        style,
      ]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : null]}>
        {label}
        {typeof count === 'number' ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  default: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5f5',
  },
  selected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  label: {
    fontSize: 14,
    color: '#334155',
  },
  selectedLabel: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});
