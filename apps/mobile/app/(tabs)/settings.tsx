import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const profile = useAuthStore((state) => state.profile);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Unable to sign out', error.message ?? 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email}</Text>
      </View>
      <Button label="Log out" variant="secondary" onPress={handleSignOut} style={{ marginTop: 32 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#475569',
  },
  label: {
    color: '#94a3b8',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
  },
});
