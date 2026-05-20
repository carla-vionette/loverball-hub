import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const AppLayout = ({ children, hideNav = false }: AppLayoutProps) => {
  const { user } = useAuth();

  if (hideNav || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
