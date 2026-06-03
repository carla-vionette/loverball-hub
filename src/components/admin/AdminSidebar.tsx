import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Calendar, Video,
  LogOut, Settings, CreditCard, BarChart3,
  FileText, Sparkles, History, UserPlus
} from 'lucide-react';
import loverballLogo from '@/assets/loverball-logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApps?: number;
  pendingCreators?: number;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'applications', label: 'Applications', icon: UserPlus },
  { id: 'creators', label: 'Creator Apps', icon: FileText },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'content', label: 'Curated Content', icon: Sparkles },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity Log', icon: History },
];

const AdminSidebar = ({ activeTab, onTabChange, pendingApps = 0, pendingCreators = 0 }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const getBadge = (id: string) => {
    if (id === 'applications' && pendingApps > 0) return pendingApps;
    if (id === 'creators' && pendingCreators > 0) return pendingCreators;
    return 0;
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-card border-r border-border flex flex-col py-6 overflow-y-auto">
      <div className="flex items-center gap-3 px-5 pb-6 border-b border-border mb-4">
        <img src={loverballLogo} alt="Loverball" className="w-[120px] h-auto" loading="lazy" decoding="async" />
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
          ADMIN
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = getBadge(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-colors duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 px-3">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200 mb-1"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          Back to App
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left text-destructive hover:bg-destructive/10 transition-colors duration-200"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
