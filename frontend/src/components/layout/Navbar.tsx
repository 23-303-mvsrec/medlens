import React from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  ShieldCheck,
  Stethoscope,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, role, setRole, logout } = useAuthStore();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleRoleSwitch = (newRole: 'Admin' | 'Doctor') => {
    setRole(newRole);
    toast.success(`Switched to ${newRole} role`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Session terminated successfully');
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search records, patients, or docs..." 
            className="pl-11 h-11 border-transparent bg-slate-100/50 text-sm placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">


        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-12 w-auto flex items-center gap-3 p-1 pr-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/20">
            <Avatar className="h-9 w-9 rounded-xl border border-slate-100">
              <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-none mt-1">{role}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mt-2 rounded-[2rem] p-2 border-slate-100 shadow-2xl animate-in fade-in zoom-in duration-200" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-bold leading-none text-slate-900">{user?.name}</p>
                <p className="text-xs font-medium leading-none text-slate-400">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />
            <div className="p-2 space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 py-2">Role Management</p>
              <DropdownMenuItem 
                onSelect={() => handleRoleSwitch('Admin')}
                className={cn(
                  "gap-3 px-3 py-2.5 cursor-pointer rounded-2xl transition-all",
                  role === 'Admin' ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", role === 'Admin' ? "bg-indigo-100" : "bg-slate-100")}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold">Administrative</span>
                {role === 'Admin' && <span className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={() => handleRoleSwitch('Doctor')}
                className={cn(
                  "gap-3 px-3 py-2.5 cursor-pointer rounded-2xl transition-all",
                  role === 'Doctor' ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", role === 'Doctor' ? "bg-indigo-100" : "bg-slate-100")}>
                  <Stethoscope className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold">Clinical Staff</span>
                {role === 'Doctor' && <span className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="mx-2" />
            <div className="p-2">
              <DropdownMenuItem className="gap-3 px-3 py-2.5 cursor-pointer rounded-2xl hover:bg-slate-50 text-slate-600">
                <UserIcon className="h-4 w-4" />
                <span className="text-sm font-bold">Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-3 py-2.5 cursor-pointer rounded-2xl hover:bg-rose-50 text-rose-600" onSelect={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-bold">Terminate Session</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
