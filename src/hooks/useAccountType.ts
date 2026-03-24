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
          .select('primary_role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        // Map primary_role to account type; profiles table doesn't have account_type/approval_status
        const role = (data?.primary_role as string) || 'member';
        const mappedType: AccountType = (role === 'creator' || role === 'team' || role === 'organization') ? role as AccountType : 'member';
        setAccountType(mappedType);
        setApprovalStatus('approved');
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
