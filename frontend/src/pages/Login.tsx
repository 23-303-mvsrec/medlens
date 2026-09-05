import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, Stethoscope, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const error = await login(email, password);
      
      if (error === null) {
        // null means success
        toast.success('Successfully logged in');
        const role = useAuthStore.getState().role;
        if (role?.toLowerCase() === 'admin') {
          navigate('/dashboard');
        } else if (role?.toLowerCase() === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // error is the message string from the backend
        toast.error(error);
      }
    } catch {
      toast.error('Connection error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Decorative Left Section */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 to-indigo-900/90" />
        
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" 
        />

        <div className="relative z-10 max-w-lg text-white space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <Shield className="h-4 w-4 text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Enterprise Protocol Secure</span>
            </div>
            <h2 className="text-5xl font-bold leading-tight tracking-tighter">Precision in Healthcare Management.</h2>
            <p className="text-xl text-indigo-100/80 font-medium">
              AI-powered clinical information intake, report extraction, and verification\.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: 'Uptime', value: '99.99%' },
              { label: 'Security', value: 'AES-256' },
              { label: 'Users', value: '12K+' },
              { label: 'Region', value: 'Global' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Login Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MedLens</h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Clinical Information Intelligence</p>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">Welcome Back</h3>
            <p className="text-slate-500 font-medium">Log in to manage your medical ecosystem.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Professional ID / Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="name@MedLens.com" 
                    className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-indigo-600 focus-visible:ring-offset-0 shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Access Key</Label>
                  <Button variant="link" className="px-0 h-auto text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700">Forgot?</Button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-indigo-600 focus-visible:ring-offset-0 shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 gap-2 mt-2 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Access <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

