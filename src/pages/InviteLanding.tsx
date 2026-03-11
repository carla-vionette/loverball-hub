import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const InviteLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store invite code in sessionStorage for use after signup
      sessionStorage.setItem('invite_code', code);
    }
    // Redirect to auth with invite context
    navigate(`/auth?invite=${code || ''}`, { replace: true });
  }, [code, navigate]);

  return null;
};

export default InviteLanding;
