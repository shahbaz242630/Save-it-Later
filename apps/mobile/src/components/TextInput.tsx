import { StyleSheet, Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  errorMessage?: string;
}

export function TextInput({ label, errorMessage, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        style={[styles.input, style, errorMessage ? styles.inputError : null]}
        placeholderTextColor="#94a3b8"
        {...rest}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  error: {
    color: '#dc2626',
    marginTop: 4,
    fontSize: 13,
  },
});
