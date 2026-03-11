import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
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
      <MobileHeader />
      <DesktopNav />
      <main className="md:ml-64 pt-[72px] md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
