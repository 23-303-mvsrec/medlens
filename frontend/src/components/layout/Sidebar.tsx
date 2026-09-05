import { toast } from 'sonner';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles,
  Users, 
  Files, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Database,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore, useAuthStore } from '@/store';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = [
    { 
      name: 'Overview', 
      icon: LayoutDashboard, 
      path: '/dashboard', 
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Patients', 
      icon: Users, 
      path: '/patients', 
      badge: 'Intake',
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Documents', 
      icon: Files, 
      path: '/documents', 
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Clinical Record', 
      icon: Sparkles, 
      path: '/medlens', 
      badge: 'Structured',
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Review Center', 
      icon: AlertTriangle, 
      path: '/review', 
      badge: 'Radar',
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Timeline', 
      icon: TrendingUp, 
      path: '/trends', 
      badge: 'Delta',
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Data Inspector', 
      icon: Database, 
      path: '/database', 
      roles: ['Admin', 'Doctor'] 
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      path: '/settings', 
      roles: ['Admin', 'Doctor'] 
    },
  ];

  const filteredItems = menuItems.filter(item => !role || item.roles.includes(role));

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 240 : 80 }}
      className={cn(
        "relative h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-50",
        !isSidebarOpen && "items-center"
      )}
    >
      <div className={cn(
        "p-5 flex items-center gap-3 border-b border-slate-100",
        !isSidebarOpen && "justify-center px-0 h-16"
      )}>
        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              MedLens
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              AI Clinical Insight
            </span>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group text-xs",
              isActive 
                ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0 text-slate-500 group-hover:text-indigo-600", isSidebarOpen && "mr-3")} />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1">
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Safety compliance mini note */}
      {isSidebarOpen && (
        <div className="px-4 py-2 mx-3 mb-2 bg-indigo-50/50 border border-indigo-100/80 rounded-lg text-[10px] text-slate-500">
          <p className="font-semibold text-indigo-900 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-indigo-600" />
            Responsible AI Safe
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Non-diagnostic clinical assistant</p>
        </div>
      )}

      <div className="p-3 border-t border-slate-100 flex flex-col gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md px-3 text-xs"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {isSidebarOpen && <span>Logout</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md px-3 text-xs"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4" />}
          {isSidebarOpen && <span className="font-medium">Collapse</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

