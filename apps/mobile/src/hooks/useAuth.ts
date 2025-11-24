import { useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { useAuthStore } from '@/store/authStore';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('Unable to load profile', error.message);
  }

  return data ?? null;
}

export async function ensureProfile(session: Session | null) {
  if (!session) return null;
  const existing = await fetchProfile(session.user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: session.user.id, email: session.user.email })
    .select('*')
    .single();

  if (error) {
    console.warn('Failed to seed profile', error.message);
    return null;
  }

  return data;
}

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      await ensureProfile(data.session ?? null);
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setSession(null);
  }, [setProfile, setSession]);

  return {
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
