import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
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
          ? { email, name, password, role }
          : { email, password };

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Logged in as <span className="font-semibold">{existingUser.name}</span> ({existingUser.email})
          </p>
          <p className="text-xs text-gray-500">You can now save preferences and build your developer profile.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsDropdown onNotificationClick={onNotificationClick} />
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Login</h2>
          <p className="text-xs text-gray-500">Required to maintain developer profiles and preferences.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('login')}
            className={`px-3 py-1.5 text-xs rounded-md border ${mode === 'login' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-3 py-1.5 text-xs rounded-md border ${mode === 'register'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200'
              }`}
          >
            Register
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="you@company.com"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
          )}
        </div>

        {mode === 'register' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="developer">Developer</option>
                <option value="manager">Project Manager</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Minimum 6 characters"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {mode === 'register' ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
          {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;

