import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const PricingPage = () => {
  const navigate = useNavigate();

  // Redirect to the new membership page
  navigate('/membership', { replace: true });

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Redirecting to membership…</p>
      </div>
    </AppLayout>
  );
};

export default PricingPage;
