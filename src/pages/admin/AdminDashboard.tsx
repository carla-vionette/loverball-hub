import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminOverviewTab from '@/pages/admin/AdminOverviewTab';
import AdminMembersTab from '@/pages/admin/AdminMembersTab';
import AdminVideosTab from '@/pages/admin/AdminVideosTab';
import AdminEventsTab from '@/pages/admin/AdminEventsTab';
import AdminApplicationsTab from '@/pages/admin/AdminApplicationsTab';
import AdminSubscriptionsTab from '@/pages/admin/AdminSubscriptionsTab';
import AdminAnalyticsTab from '@/pages/admin/AdminAnalyticsTab';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, RefreshCw } from 'lucide-react';
import type { UserProfile, MemberApplication, EventItem, VideoItem } from '@/types';
import { fetchMembers, fetchApplications, fetchAdminEvents, fetchAdminVideos } from '@/services/adminService';

export type AdminTab = 'overview' | 'members' | 'applications' | 'events' | 'videos' | 'subscriptions' | 'analytics';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
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

  const tabs: AdminTab[] = ['overview', 'members', 'applications', 'videos', 'events', 'subscriptions', 'analytics'];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <AdminSidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as AdminTab)} />
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Mobile tab bar */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {tabs.map(tab => (
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

        {/* Tab content */}
        {activeTab === 'overview' && <AdminOverviewTab />}
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
        {activeTab === 'subscriptions' && <AdminSubscriptionsTab />}
        {activeTab === 'analytics' && <AdminAnalyticsTab />}
      </main>
    </div>
  );
};

export default AdminDashboard;
