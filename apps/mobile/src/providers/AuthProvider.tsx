import { PropsWithChildren, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureProfile } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const existingSession = data?.session ?? null;
        if (!isMounted) return;
        setSession(existingSession);
        const profile = await ensureProfile(existingSession);
        if (isMounted) {
          setProfile(profile);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        setSession(nextSession);
        const profile = await ensureProfile(nextSession);
        if (isMounted) {
          setProfile(profile);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [setLoading, setProfile, setSession]);

  return children;
}
