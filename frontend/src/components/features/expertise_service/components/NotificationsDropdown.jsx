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
        params: { unread_only: false } // Get all, but we'll show unread differently
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Poll every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Click outside to close
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
    if (e) e.stopPropagation(); // prevent closing if clicking specifically the dot
    try {
      const token = getAuthToken();
      await axios.put(`${API_BASE_URL}/api/expertise/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optimistically update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }

    // Developer diagnostics:
    if (!notif.relatedIssueId) {
      alert(`[Diagnostics]: This specific notification (${notif.type}) has NO Issue ID attached in the database.`);
      return;
    }

    if (typeof onNotificationClick !== 'function') {
      alert(`[Diagnostics]: The onNotificationClick prop is missing! Type: ${typeof onNotificationClick}`);
      return;
    }

    onNotificationClick(notif.relatedIssueId);
    setIsOpen(false);
  };

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">You have no notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50' : 'opacity-70'}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notif.type === 'assignment' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Clock className="w-4 h-4" />
                          </div>
                        ) : notif.type === 'resolution' ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                            <Bell className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {notif.createdAt && !isNaN(new Date(notif.createdAt)) ? new Date(notif.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 flex items-start">
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="w-2.5 h-2.5 bg-blue-600 rounded-full hover:bg-blue-800 transition-colors"
                            title="Mark as read"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
