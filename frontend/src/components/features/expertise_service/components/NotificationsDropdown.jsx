import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import { getAuthToken, getCurrentUser } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const NotificationsDropdown = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const currentUser = getCurrentUser();

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE_URL}/api/expertise/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { unread_only: false }
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchNotifications();
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = getAuthToken();
      await axios.put(`${API_BASE_URL}/api/expertise/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.relatedIssueId && typeof onNotificationClick === 'function') {
      onNotificationClick(notif.relatedIssueId);
    }
    setIsOpen(false);
  };

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-2xl transition-all duration-300 active:scale-90 ${
          isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
        aria-label="Access Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-200/60 z-[10005] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500">
          <div className="bg-slate-900 px-8 py-6 flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none">Intelligence Brief</h3>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-2">{unreadCount} New Signals Detected</p>
            </div>
            
            <button className="p-2 text-white/40 hover:text-white transition-colors">
                <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
            {loading && notifications.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] animate-pulse">Syncing Streams...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                    <Bell size={40} className="opacity-20" />
                </div>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">All Systems Clear</p>
                <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">No new telemetry detected</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/60">
                {notifications.map(notif => {
                  const isAssignment = notif.type === 'assignment';
                  const isResolution = notif.type === 'resolution';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`p-6 hover:bg-white transition-all cursor-pointer relative group ${!notif.read ? 'bg-white' : 'opacity-60'}`}
                    >
                      <div className="flex gap-5 relative z-10">
                        <div className="flex-shrink-0">
                          {isAssignment ? (
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-100 group-hover:scale-110 transition-transform">
                              <Bell size={20} />
                            </div>
                          ) : isResolution ? (
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100 group-hover:scale-110 transition-transform">
                              <CheckCircle size={20} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-inner border border-slate-200 group-hover:scale-110 transition-transform">
                              <Bell size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${
                                isAssignment ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                isResolution ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                'bg-slate-500/10 text-slate-600 border-slate-500/20'
                              }`}>
                              {notif.type || 'SYSTEM'}
                            </span>
                             <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                              {notif.createdAt && !isNaN(new Date(notif.createdAt))
                                ? new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <p className={`text-sm tracking-tight leading-tight uppercase ${!notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 pt-1">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isAssignment ? 'bg-indigo-500' : isResolution ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border-t border-slate-100 p-6 text-center">
            <button className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
              Clear All Signals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
