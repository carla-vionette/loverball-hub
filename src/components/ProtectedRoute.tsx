import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const ALLOWED_EMAIL = "member@loverball.com";

interface ProtectedRouteProps {
  children: ReactNode;
  requireMember?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireMember = false, 
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { user, loading, isMember, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Sign out users who aren't the allowed email
    if (user && user.email?.toLowerCase() !== ALLOWED_EMAIL) {
      supabase.auth.signOut();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user email is allowed
  if (user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/following" replace />;
  }

  if (requireMember && !isMember) {
    return <Navigate to="/invite" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
