import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
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
  const initializedRef = useRef(false);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching role:', error);
      return null;
    }
    return data?.role as AppRole | null;
  };

  const refreshRole = async () => {
    if (user) {
      const userRole = await fetchUserRole(user.id);
      setRole(userRole);
    }
  };

  useEffect(() => {
    const applySession = async (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const userRole = await fetchUserRole(s.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
    };

    // Listener can fire before the initial session is hydrated. We keep `loading=true`
    // until the initial getSession() finishes to avoid ProtectedRoute redirects.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      applySession(s).finally(() => {
        if (initializedRef.current) setLoading(false);
      });
    });

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      await applySession(s);
      initializedRef.current = true;
      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
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
