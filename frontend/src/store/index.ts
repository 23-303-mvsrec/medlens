import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<string | null>;
  loginAsDemo: (demoRole: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const defaultDemoUser: User = {
  id: 'u-clinician-01',
  name: 'Dr. Eleanor Vance',
  email: 'clinician@medlens.ai',
  role: 'Doctor',
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
  specialization: 'Internal Medicine / Clinical Intelligence'
};

const savedUser = localStorage.getItem('user');
const initialUser: User = savedUser ? JSON.parse(savedUser) : defaultDemoUser;
const initialRole: UserRole = (localStorage.getItem('role') as UserRole) || 'Doctor';

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: localStorage.getItem('token') || 'demo-medlens-token',
  isAuthenticated: true, // Always allow instant access for hackathon demo
  role: initialRole,
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Fallback for hackathon: Log in as demo clinician directly
        const user: User = {
          id: 'demo-user',
          name: email.split('@')[0].toUpperCase(),
          email: email,
          role: 'Doctor',
          avatar: `https://i.pravatar.cc/150?u=${email}`,
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', 'Doctor');
        set({ user, token: 'demo-token', role: 'Doctor', isAuthenticated: true });
        return null;
      }

      const data = await response.json();
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.role.charAt(0).toUpperCase() + data.role.slice(1),
        avatar: `https://i.pravatar.cc/150?u=${data.user.id}`,
      };

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);

      set({ 
        user, 
        token: data.access_token, 
        role: user.role as UserRole, 
        isAuthenticated: true 
      });
      
      return null;
    } catch (error) {
      // On network failure, still allow instant demo login
      set({ user: defaultDemoUser, token: 'demo-token', role: 'Doctor', isAuthenticated: true });
      return null;
    }
  },

  loginAsDemo: (demoRole: UserRole) => {
    const demoUser: User = {
      id: `demo-${demoRole.toLowerCase()}`,
      name: demoRole === 'Admin' ? 'System Administrator' : 'Dr. Eleanor Vance',
      email: `${demoRole.toLowerCase()}@medlens.ai`,
      role: demoRole,
      avatar: demoRole === 'Admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
        : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('role', demoRole);
    set({ user: demoUser, token: 'demo-token', role: demoRole, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    set({ user: null, token: null, role: null, isAuthenticated: false });
  },

  setRole: (role) => {
    localStorage.setItem('role', role);
    set((state) => ({ 
      role,
      user: state.user ? { ...state.user, role } : null 
    }));
  },
}));

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
