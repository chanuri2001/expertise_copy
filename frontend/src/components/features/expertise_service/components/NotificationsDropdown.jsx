import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, CheckCircle, Clock, MoreHorizontal, 
  Search, SlidersHorizontal, Info, MessageSquare, 
  X, AlertCircle, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { getAuthToken, getCurrentUser } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const NotificationsDropdown = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleClearAll = async () => {
    // In a real app, this would call an API endpoint
    setNotifications([]);
    setIsOpen(false);
  };

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => {
            setIsOpen(true);
            document.body.classList.add('modal-open');
        }}
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

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={() => {
                setIsOpen(false);
                document.body.classList.remove('modal-open');
            }}
          />
          
          <div className="bg-white rounded-[3rem] shadow-premium border border-slate-200/60 max-w-4xl w-full relative z-10 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col h-[85vh]">
            
            {/* Header: Intelligence Brief */}
            <div className="bg-[#0F172A] px-12 py-10 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Intelligence Brief</h2>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em]">{unreadCount} New Signals Detected</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                            <MoreHorizontal size={20} />
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                            <SlidersHorizontal size={20} />
                        </button>
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                document.body.classList.remove('modal-open');
                            }}
                            className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-white/40 hover:text-rose-400 transition-all ml-2"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-8">
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Establishing Uplink...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-soft border border-slate-100 flex items-center justify-center text-slate-200 mb-8">
                            <Bell size={48} className="opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Systems Quiet</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">No telemetry signals found in this sector</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNotifications.map((notif) => {
                            const isResolution = notif.type === 'resolution';
                            const isAssignment = notif.type === 'assignment';
                            const isAlert = notif.type === 'alert' || notif.title.toLowerCase().includes('update') || notif.title.toLowerCase().includes('scheduled');
                            const isComment = notif.type === 'comment' || notif.message.toLowerCase().includes('commented');

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-premium hover:-translate-y-0.5 transition-all cursor-pointer relative ${!notif.read ? 'border-l-4 border-l-indigo-500' : 'opacity-80'}`}
                                >
                                    <div className="flex items-start gap-6">
                                        <div className="shrink-0 mt-1">
                                            {isResolution ? (
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                                    <CheckCircle size={24} />
                                                </div>
                                            ) : isAssignment ? (
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                                    <Bell size={24} />
                                                </div>
                                            ) : isAlert ? (
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                                    <Info size={24} />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                                    <MessageSquare size={24} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border shadow-sm ${
                                                        isResolution ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        isAssignment ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                                        isAlert ? 'bg-slate-900 text-white border-slate-900' :
                                                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                    }`}>
                                                        {isResolution ? 'RESOLUTION' : isAssignment ? 'ASSIGNMENT' : isAlert ? 'SYSTEM ALERT' : 'COMMENT'}
                                                    </span>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{notif.title}</h4>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">
                                                    {notif.createdAt && !isNaN(new Date(notif.createdAt))
                                                        ? new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                        : 'APR 18'
                                                    }
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>
                                        
                                        {!notif.read && (
                                            <div className="shrink-0 self-center">
                                                <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)] animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer: Search & Actions */}
            <div className="bg-white border-t border-slate-100 p-10 shrink-0 space-y-8 relative z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-6">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search / Filter"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 pl-16 pr-8 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:tracking-[0.2em]"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200" />
                        <button className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={handleClearAll}
                        className="bg-[#1D4ED8] hover:bg-indigo-700 text-white px-12 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-4"
                    >
                        Clear All Signals
                    </button>
                </div>
            </div>
          </div>
        </div>,
        document.getElementById('portal-root') || document.body
      )}
    </div>
  );
};

export default NotificationsDropdown;
