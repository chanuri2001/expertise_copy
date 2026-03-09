import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
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
        className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-[11px] text-slate-400 font-medium animate-pulse uppercase tracking-widest">Synchronizing...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Bell size={32} className="text-slate-100 mb-3" />
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Inbox Zero</p>
                <p className="text-[10px] text-slate-300 mt-1">Check back later for updates</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(notif => {
                  const isAssignment = notif.type === 'assignment';
                  const isResolution = notif.type === 'resolution';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notif.read
                          ? (isAssignment ? 'bg-blue-50/40' : isResolution ? 'bg-emerald-50/40' : 'bg-slate-50/40')
                          : ''
                        }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {isAssignment ? (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200/50">
                              <Bell size={18} />
                            </div>
                          ) : isResolution ? (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200/50">
                              <CheckCircle size={18} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm border border-slate-200/50">
                              <Bell size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${isAssignment ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                isResolution ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  'bg-slate-500/10 text-slate-600 border-slate-500/20'
                              }`}>
                              {notif.type || 'SYSTEM'}
                            </span>
                          </div>
                          <p className={`text-xs ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                              {notif.createdAt && !isNaN(new Date(notif.createdAt))
                                ? new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                        {!notif.read && (
                          <div className="absolute top-4 right-4 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${isAssignment ? 'bg-blue-500' : isResolution ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-50/50 border-t border-slate-100 p-3 text-center">
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
