import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { Profile, Role } from './types';

type Session = {
  user: { id: string; email: string };
  profile: Profile;
};

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signIn: async () => ({ error: 'not ready' }),
  signUp: async () => ({ error: 'not ready' }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, email: string): Promise<Session | null> => {
    if (!supabase) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: email, role: 'parent' })
        .select()
        .maybeSingle();
      if (newProfile) {
        return { user: { id: userId, email }, profile: newProfile as Profile };
      }
      return null;
    }
    return { user: { id: userId, email }, profile: profile as Profile };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const s = await loadProfile(data.session.user.id, data.session.user.email ?? '');
        setSession(s);
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      (async () => {
        if (!nextSession?.user) {
          setSession(null);
          return;
        }
        const s = await loadProfile(nextSession.user.id, nextSession.user.email ?? '');
        setSession(s);
      })();
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Bağlantı kurulamadı.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: 'E-posta veya şifre hatalı.' };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?: string) => {
    if (!supabase) return { error: 'Bağlantı kurulamadı.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) {
      return { error: 'Kayıt yapılamadı. Bu e-posta zaten kullanımda olabilir.' };
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: phone || null,
        role: 'parent',
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session || !supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (data) {
      setSession({ ...session, profile: data as Profile });
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'manager': return 'Müdür / Yönetici';
    case 'teacher': return 'Öğretmen';
    case 'parent': return 'Veli';
  }
}
