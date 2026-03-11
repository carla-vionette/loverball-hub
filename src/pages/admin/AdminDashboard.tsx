import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import KpiCard from '@/components/admin/KpiCard';
import AdminMembersTab from '@/pages/admin/AdminMembersTab';
import AdminVideosTab from '@/pages/admin/AdminVideosTab';
import AdminEventsTab from '@/pages/admin/AdminEventsTab';
import AdminApplicationsTab from '@/pages/admin/AdminApplicationsTab';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Calendar, Video, RefreshCw } from 'lucide-react';
import type { UserProfile, MemberApplication, EventItem } from '@/types';
import { fetchMembers, fetchApplications, fetchAdminEvents, fetchAdminVideos } from '@/services/adminService';
import type { VideoItem } from '@/types';

type AdminTab = 'members' | 'applications' | 'events' | 'videos' | 'settings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('members');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/watch');
      return;
    }
    loadAllData();
  }, [isAdmin, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [membersData, appsData, eventsData, videosData] = await Promise.all([
        fetchMembers(),
        fetchApplications(),
        fetchAdminEvents(),
        fetchAdminVideos(),
      ]);
      setMembers(membersData);
      setApplications(appsData);
      setEvents(eventsData);
      setVideos(videosData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <AdminSidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as AdminTab)} />
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Mobile tab bar */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {(['members', 'applications', 'videos', 'events'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-colors
                ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {tab}
              {tab === 'applications' && pendingApps.length > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApps.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight capitalize">
            {activeTab}
          </h1>
          <Button variant="outline" size="sm" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Members" value={members.length} icon={Users} />
          <KpiCard label="Pending" value={pendingApps.length} icon={Users} />
          <KpiCard label="Videos" value={videos.length} icon={Video} />
          <KpiCard label="Events" value={events.length} icon={Calendar} />
        </div>

        {/* Tab content */}
        {activeTab === 'members' && (
          <AdminMembersTab members={members} onRefresh={loadAllData} />
        )}
        {activeTab === 'applications' && (
          <AdminApplicationsTab
            applications={applications}
            userId={user?.id || ''}
            onRefresh={loadAllData}
          />
        )}
        {activeTab === 'videos' && (
          <AdminVideosTab videos={videos} onRefresh={loadAllData} />
        )}
        {activeTab === 'events' && (
          <AdminEventsTab events={events} onRefresh={loadAllData} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
