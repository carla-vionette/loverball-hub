import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'pending' | 'member' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isMember: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const hasStoredSessionToken = useCallback(() => {
    if (typeof window === 'undefined') return false;

    return Object.keys(localStorage).some((key) =>
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
  }, []);

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return null;
    }
    const roles = data.map((r) => r.role as AppRole);
    // Highest privilege wins
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('member')) return 'member';
    return roles[0] ?? null;
  }, []);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const nextRole = await fetchUserRole(nextSession.user.id);
    setRole(nextRole);
    setLoading(false);
  }, [fetchUserRole]);

  const refreshRole = async () => {
    if (user) {
      const userRole = await fetchUserRole(user.id);
      setRole(userRole);
    }
  };

  useEffect(() => {
    let mounted = true;
    let bootstrapped = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;

        // Never log the user out unless they explicitly tapped "Sign out".
        // Ignore transient null sessions from refresh failures, network blips,
        // tab focus changes, or Supabase clearing tokens after a failed refresh.
        if (!nextSession) {
          const intentional = typeof window !== 'undefined' &&
            window.sessionStorage.getItem('lb-intentional-signout') === '1';

          if (!intentional) {
            // Try to recover the session in the background; never flip to signed-out.
            if (bootstrapped) {
              void supabase.auth.refreshSession().then(({ data }) => {
                if (mounted && data.session) void applySession(data.session);
              }).catch(() => {});
            }
            return;
          }
        }

        void applySession(nextSession);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;

      bootstrapped = true;
      if (!initialSession && hasStoredSessionToken()) {
        // Stored token but session not yet hydrated — try a refresh
        // instead of flipping to signed-out state.
        const { data } = await supabase.auth.refreshSession();
        await applySession(data.session ?? null);
        return;
      }
      await applySession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession, hasStoredSessionToken]);

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('lb-intentional-signout', '1');
    }
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      if (typeof window !== 'undefined') {
        // Clear flag shortly after so future sign-ins behave normally.
        setTimeout(() => {
          window.sessionStorage.removeItem('lb-intentional-signout');
        }, 1000);
      }
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    role,
    isMember: role === 'member' || role === 'admin',
    isAdmin: role === 'admin',
    signOut,
    refreshRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
