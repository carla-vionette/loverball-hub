import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Users, Ticket, Calendar, BarChart3, 
  LogOut, Settings
} from 'lucide-react';
import loverballLogo from '@/assets/loverball-logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'applications', label: 'Applications', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: Calendar },
];

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 bg-card border-r border-border flex flex-col py-6 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-6 border-b border-border mb-4">
        <img src={loverballLogo} alt="Loverball" className="h-8 w-auto" />
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
          ADMIN
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-left transition-colors duration-200
                ${isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-4 px-3">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-left text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200 mb-1"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          Back to App
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-left text-destructive hover:bg-destructive/10 transition-colors duration-200"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
