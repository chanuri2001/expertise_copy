import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, LogOut, Shield, ChevronRight } from 'lucide-react';
import { getCurrentUser, setAuthToken, setCurrentUser, logout } from '../utils/userContext';
import NotificationsDropdown from './NotificationsDropdown';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const AuthPanel = ({ onAuthChanged, onNotificationClick }) => {
  const existingUser = getCurrentUser();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState(existingUser?.email || '');
  const [name, setName] = useState(existingUser?.name || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    setPassword('');
    setError('');
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
      <div className="flex items-center gap-4 bg-slate-50/50 p-2 pl-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">{existingUser.name}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
              {existingUser.role === 'manager' ? 'Project Manager' : 'Developer'}
            </p>
          </div>
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-sm font-black text-blue-600">{existingUser.name.charAt(0).toUpperCase()}</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-1">
          <NotificationsDropdown onNotificationClick={onNotificationClick} />
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-10 max-w-xl mx-auto relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16" />

      <div className="flex flex-col items-center text-center mb-10 relative z-10">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium">Log in to manage your expertise and issues</p>
      </div>

      <div className="bg-slate-100 p-1 rounded-xl mb-8 flex relative z-10 w-fit mx-auto">
        <button
          onClick={() => setMode('login')}
          className={`px-8 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${mode === 'login'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`px-8 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${mode === 'register'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Join
        </button>
      </div>

      <form onSubmit={submit} className="space-y-6 relative z-10">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email Address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
            placeholder="name@company.com"
          />
        </div>

        {mode === 'register' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Member Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all cursor-pointer"
              >
                <option value="developer">Developer (Contributor)</option>
                <option value="manager">Lead (Manager)</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'register' ? 'Create Account' : 'Sign In'}
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;


