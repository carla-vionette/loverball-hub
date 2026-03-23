import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AccountType, ApprovalStatus } from '@/types';

interface AccountInfo {
  accountType: AccountType | null;
  approvalStatus: ApprovalStatus | null;
  isApprovedCreator: boolean;
  canPostEvents: boolean;
  canUploadVideos: boolean;
  loading: boolean;
}

export const useAccountType = (): AccountInfo => {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccountType(null);
      setApprovalStatus(null);
      setLoading(false);
      return;
    }

    const fetchAccountInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('account_type, approval_status')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        setAccountType((data?.account_type as AccountType) || 'member');
        setApprovalStatus((data?.approval_status as ApprovalStatus) || 'approved');
      } catch {
        setAccountType('member');
        setApprovalStatus('approved');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
  }, [user]);

  const isCreatorType = accountType === 'creator' || accountType === 'team' || accountType === 'organization';
  const isApproved = approvalStatus === 'approved';
  const isApprovedCreator = isCreatorType && isApproved;

  return {
    accountType,
    approvalStatus,
    isApprovedCreator,
    canPostEvents: isApprovedCreator,
    canUploadVideos: isApprovedCreator,
    loading,
  };
};
