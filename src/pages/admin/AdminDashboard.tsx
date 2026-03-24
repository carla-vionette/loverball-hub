import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import KpiCard from '@/components/admin/KpiCard';
import AdminMembersTab from '@/pages/admin/AdminMembersTab';
import AdminVideosTab from '@/pages/admin/AdminVideosTab';
import AdminEventsTab from '@/pages/admin/AdminEventsTab';
import AdminApplicationsTab from '@/pages/admin/AdminApplicationsTab';
import AdminCreatorApplicationsTab from '@/pages/admin/AdminCreatorApplicationsTab';
import AdminEventApprovalsTab from '@/pages/admin/AdminEventApprovalsTab';
import AdminVideoApprovalsTab from '@/pages/admin/AdminVideoApprovalsTab';
import AdminSubscriptionsTab from '@/pages/admin/AdminSubscriptionsTab';
import AdminAnalyticsTab from '@/pages/admin/AdminAnalyticsTab';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Users, Calendar, Video, RefreshCw, CreditCard, UserPlus, ShieldCheck } from 'lucide-react';
import type { UserProfile, MemberApplication, EventItem, VideoItem, CreatorApplication } from '@/types';
import {
  fetchMembers,
  fetchApplications,
  fetchAdminEvents,
  fetchAdminVideos,
  fetchCreatorApplications,
  fetchPendingEvents,
  fetchAllVideosForAdmin,
} from '@/services/adminService';
import { fetchDashboardStats, type DashboardStats } from '@/services/analyticsService';

type AdminTab = 'overview' | 'members' | 'applications' | 'creator-applications' | 'event-approvals' | 'video-approvals' | 'events' | 'videos' | 'subscriptions' | 'analytics';

const TAB_LABELS: Record<AdminTab, string> = {
  'overview': 'Dashboard',
  'members': 'Members',
  'applications': 'Applications',
  'creator-applications': 'Creator Apps',
  'event-approvals': 'Event Approvals',
  'video-approvals': 'Video Approvals',
  'events': 'Events',
  'videos': 'Videos',
  'subscriptions': 'Subscriptions',
  'analytics': 'Analytics',
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
      const [membersData, appsData, creatorAppsData, eventsData, allEventsData, videosData, allVideosData, statsData] = await Promise.all([
        fetchMembers(),
        fetchApplications(),
        fetchCreatorApplications(),
        fetchAdminEvents(),
        fetchPendingEvents(),
        fetchAdminVideos(),
        fetchAllVideosForAdmin(),
        fetchDashboardStats(),
      ]);
      setMembers(membersData);
      setApplications(appsData);
      setCreatorApplications(creatorAppsData);
      setEvents(eventsData);
      setAllEvents(allEventsData);
      setVideos(videosData);
      setAllVideos(allVideosData);
      setStats(statsData);
    } catch (error) {
      // Admin data fetch error handled silently
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const pendingCreatorApps = creatorApplications.filter(a => a.status === 'pending');
  const pendingEvents = allEvents.filter(e => e.approval_status === 'pending');
  const pendingVideos = allVideos.filter(v => v.approval_status === 'pending');

  const totalPendingItems = pendingApps.length + pendingCreatorApps.length + pendingEvents.length + pendingVideos.length;

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
          {(Object.keys(TAB_LABELS) as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors
                ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {TAB_LABELS[tab]}
              {tab === 'creator-applications' && pendingCreatorApps.length > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCreatorApps.length}
                </span>
              )}
              {tab === 'event-approvals' && pendingEvents.length > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingEvents.length}
                </span>
              )}
              {tab === 'video-approvals' && pendingVideos.length > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingVideos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
            {TAB_LABELS[activeTab]}
          </h1>
          <Button variant="outline" size="sm" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
              <KpiCard label="Members" value={stats?.totalMembers || members.length} icon={Users} />
              <KpiCard label="Pending Apps" value={pendingCreatorApps.length} icon={ShieldCheck} />
              <KpiCard label="Pending Events" value={pendingEvents.length} icon={Calendar} />
              <KpiCard label="Pending Videos" value={pendingVideos.length} icon={Video} />
              <KpiCard label="Total Events" value={stats?.totalEvents || events.length} icon={Calendar} />
              <KpiCard label="Paid Subs" value={stats?.activeSubscriptions || 0} icon={CreditCard} />
              <KpiCard label="New (7d)" value={stats?.recentSignups || 0} icon={UserPlus} />
            </div>

            {totalPendingItems > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-amber-800 mb-2">Items Requiring Attention</h3>
                <div className="flex flex-wrap gap-3">
                  {pendingCreatorApps.length > 0 && (
                    <button onClick={() => setActiveTab('creator-applications')} className="text-sm text-amber-700 hover:text-amber-900 underline">
                      {pendingCreatorApps.length} creator application{pendingCreatorApps.length > 1 ? 's' : ''}
                    </button>
                  )}
                  {pendingEvents.length > 0 && (
                    <button onClick={() => setActiveTab('event-approvals')} className="text-sm text-amber-700 hover:text-amber-900 underline">
                      {pendingEvents.length} event{pendingEvents.length > 1 ? 's' : ''} awaiting approval
                    </button>
                  )}
                  {pendingVideos.length > 0 && (
                    <button onClick={() => setActiveTab('video-approvals')} className="text-sm text-amber-700 hover:text-amber-900 underline">
                      {pendingVideos.length} video{pendingVideos.length > 1 ? 's' : ''} awaiting approval
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Recent Members</h3>
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  {members.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-muted-foreground text-sm">No members yet.</p>}
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Upcoming Events</h3>
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="font-medium">{e.title}</span>
                      <span className="text-muted-foreground text-xs">{new Date(e.event_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {events.length === 0 && <p className="text-muted-foreground text-sm">No events yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}

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
        {activeTab === 'creator-applications' && (
          <AdminCreatorApplicationsTab
            onRefresh={loadAllData}
          />
        )}
        {activeTab === 'event-approvals' && (
          <AdminEventApprovalsTab events={allEvents} onRefresh={loadAllData} />
        )}
        {activeTab === 'video-approvals' && (
          <AdminVideoApprovalsTab videos={allVideos} onRefresh={loadAllData} />
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
