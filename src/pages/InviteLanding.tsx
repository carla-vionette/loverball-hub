import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const InviteLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store invite code in localStorage for use after signup
      localStorage.setItem('loverball_invite_code', code);
    }
    // Redirect to auth page
    navigate('/auth', { replace: true });
  }, [code, navigate]);

  return null;
};

export default InviteLanding;
