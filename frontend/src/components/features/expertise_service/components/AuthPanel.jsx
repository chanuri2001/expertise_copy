import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, LogOut, Shield, ChevronRight, AlertTriangle, User, X, Lock } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getCurrentUser, setAuthToken, setCurrentUser, logout } from '../utils/userContext';
import NotificationsDropdown from './NotificationsDropdown';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const Avatar = ({ name, size = "md" }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
  const sizeClasses = size === "md" ? "w-10 h-10 text-xs" : "w-12 h-12 text-sm";
  
  return (
    <div className={`${sizeClasses} rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
};

const AuthPanel = ({ onAuthChanged, onNotificationClick }) => {
  const existingUser = getCurrentUser();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState(existingUser?.email || '');
  const [name, setName] = useState(existingUser?.name || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setPassword('');
    setError('');
    setShowLogoutConfirm(false);
    onAuthChanged?.(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? { email: email.trim(), name: name.trim(), password: password.trim(), role }
          : { email: email.trim(), password: password.trim() };

      const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      const { access_token, user } = res.data;
      setAuthToken(access_token);
      setCurrentUser(user);
      setPassword('');
      onAuthChanged?.(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  if (existingUser) {
    return (
      <div className="flex items-center gap-6 bg-white rounded-2xl p-1.5 pl-6 border border-slate-100 shadow-soft group relative z-50 transition-all hover:shadow-premium">
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none uppercase tracking-tight">{existingUser.name}</p>
            <p className="text-[9px] font-bold text-brand uppercase tracking-widest mt-1.5">
              {existingUser.role === 'manager' ? 'Administrator' : 'Specialist'}
            </p>
          </div>
          <Avatar name={existingUser.name} />
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <div className="flex items-center gap-1">
          <NotificationsDropdown onNotificationClick={onNotificationClick} />
          <button
            onClick={handleLogout}
            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
            title="Terminate Session"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && createPortal(
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="bg-white rounded-4xl shadow-premium border border-slate-100 p-10 max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-300 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-2">End Session?</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10 leading-relaxed">Confirm departure from the system terminal.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" />
      
      <div className="bg-white rounded-5xl shadow-premium border border-slate-100 p-10 md:p-14 max-w-xl w-full relative z-10 overflow-y-auto max-h-[92vh] no-scrollbar animate-in zoom-in-95 fade-in duration-500">
        {/* Decorative Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        
        <div className="flex flex-col items-center text-center mb-12 relative z-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl mb-8">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none">Authentication</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Authorized Access Required</p>
        </div>

        <div className="bg-slate-100/50 p-1 rounded-2xl mb-10 flex relative z-10 w-fit mx-auto border border-slate-100 shadow-inner">
          <button
            onClick={() => setMode('login')}
            className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${mode === 'login'
              ? 'bg-white text-slate-900 shadow-soft'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${mode === 'register'
              ? 'bg-white text-slate-900 shadow-soft'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Join Terminal
          </button>
        </div>

        <form onSubmit={submit} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Terminal ID</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-slate-300"
              placeholder="operator@system.io"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnel Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-slate-300"
                  placeholder="Subject Name"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Designated Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="developer">Operational Specialist (Dev)</option>
                  <option value="manager">Lead Administrator (PM)</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-slate-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-500 p-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-4 animate-shake">
              <AlertTriangle size={18} className="shrink-0" />
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 hover:bg-brand text-white py-5 rounded-3xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-premium active:scale-[0.98] disabled:opacity-50 group/btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'register' ? 'Initialize Account' : 'Establish Link'}
                <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-12 pt-10 border-t border-slate-50 relative z-10">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-6 text-center">Fast Deployment Profiles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
              {[
                { email: 'natty@gmail.com', name: 'Natty (PM)', role: 'manager' },
                { email: 'alex@gmail.com', name: 'Alex (Dev)', role: 'developer' },
                { email: 'sarah@gmail.com', name: 'Sarah (Dev)', role: 'developer' },
                { email: 'elena@gmail.com', name: 'Elena (Dev)', role: 'developer' }
              ].map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setRole(u.role);
                    setPassword('password');
                  }}
                  className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-brand rounded-2xl transition-all group/user hover:shadow-soft"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase group-hover/user:bg-brand group-hover/user:text-white transition-all shadow-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-700 group-hover/user:text-brand uppercase tracking-tight">{u.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AuthPanel;
