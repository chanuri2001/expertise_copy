import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, TrendingUp, CheckCircle, Clock, AlertCircle, FileCheck, LayoutDashboard, Star, Award } from 'lucide-react';
import axios from 'axios';
import { getAuthToken, getCurrentUser } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const Avatar = ({ name, size = "md" }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
  const sizeClasses = size === "md" ? "w-20 h-20 text-xl" : "w-12 h-12 text-sm";
  
  return (
    <div className={`${sizeClasses} rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-white overflow-hidden shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
};

const DeveloperProfileView = ({
  developerEmail,
  onClose,
  isSubmitter = false,
  submitterName = null,
  submitterRole = 'developer',
  isBrief = false,
  isModal = true
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [categories, setCategories] = useState([]);

  const sessionUser = getCurrentUser();
  const isSelf = sessionUser?.email && sessionUser.email === developerEmail;

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expertise/config`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAssignedIssues();
  }, [developerEmail]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/expertise/developers/${developerEmail}/detail`);
      setProfile(response.data);
    } catch (err) {
      if ((isSubmitter || isSelf) && err.response?.status === 404) {
        try {
          const nameToUse = submitterName || sessionUser?.name || developerEmail.split('@')[0];
          await axios.post(`${API_BASE_URL}/api/expertise/create-submitter-profile`, null, {
            params: { email: developerEmail, name: nameToUse }
          });
          const retryResponse = await axios.get(`${API_BASE_URL}/api/expertise/developers/${developerEmail}/detail`);
          setProfile(retryResponse.data);
        } catch (createErr) {
          setError('Failed to create or load developer profile');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to load developer profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (prefs) => {
    if (!isSelf) return;
    setSavingPrefs(true);
    try {
      await axios.put(`${API_BASE_URL}/api/expertise/me/preferences`, prefs, { headers: authHeaders() });
      await fetchProfile();
    } catch (err) {
      console.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const fetchAssignedIssues = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/expertise/developers/${developerEmail}/issues`
      );
      setAssignedIssues(response.data || []);
    } catch (err) {
      setAssignedIssues([]);
    }
  };

  const handleAcceptIssue = async (issueId) => {
    try {
      const token = getAuthToken();
      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/${issueId}/accept?developerEmail=${encodeURIComponent(developerEmail)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAssignedIssues();
      fetchProfile();
    } catch (err) {
      console.error('Failed to accept issue');
    }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      const token = getAuthToken();
      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/${issueId}/complete?developerEmail=${encodeURIComponent(developerEmail)}&resolutionNote=Resolved via dashboard`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAssignedIssues();
      fetchProfile();
    } catch (err) {
      console.error('Failed to resolve issue');
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'low': return 'bg-indigo-50 text-brand border-brand/10';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (loading) {
    const loadingContent = (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Intelligence...</p>
      </div>
    );
    return isModal ? (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
        <div className="bg-white rounded-4xl p-10 shadow-premium border border-slate-100">{loadingContent}</div>
      </div>
    ) : loadingContent;
  }

  if (error || !profile) {
    const errorContent = (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-6">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Access Restricted</h4>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">{error || 'Intel not found'}</p>
        </div>
        <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
          Exit Profile
        </button>
      </div>
    );
    return isModal ? (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
        <div className="bg-white rounded-4xl p-10 shadow-premium border border-slate-100 max-w-sm w-full">{errorContent}</div>
      </div>
    ) : errorContent;
  }

  const dev = profile.profile;
  const prefs = dev.preferences || {};
  const editablePrefs = {};
  categories.forEach(cat => { editablePrefs[cat] = prefs[cat] ?? 0.5; });

  const content = (
    <div className={`bg-white rounded-5xl shadow-premium w-full flex flex-col relative overflow-hidden ${isModal ? 'max-w-6xl max-h-[90vh] border border-slate-100' : ''}`}>
      {/* Premium Header */}
      <div className="bg-slate-900 p-12 flex justify-between items-center shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand/10 rounded-full blur-[120px] -mr-80 -mt-80" />
        
        <div className="flex items-center gap-8 relative z-10">
          <Avatar name={dev.name} />
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase leading-none">{dev.name}</h2>
              <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${dev.status?.toLowerCase() === 'active'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-warning/10 border-warning/20 text-warning'
                }`}>
                {dev.status || 'Active'}
              </span>
            </div>
            <div className="flex items-center gap-6 text-slate-400">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-500" />
                <span className="text-xs font-medium tracking-tight">{dev.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{dev.role || 'Contributor'}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-90 relative z-10">
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Expertise Matrix */}
            <div className="bg-white rounded-4xl p-10 shadow-soft border border-slate-100 group transition-all">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-1 bg-brand h-6 rounded-full" />
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Expertise Intelligence</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {categories.map((category) => {
                  const score = dev.expertise?.[category] || 0;
                  return (
                    <div key={category} className="group/item">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/item:text-brand transition-colors">{category}</span>
                        <span className="text-xs font-bold text-slate-900">{Math.round(score * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${score > 0.8 ? 'bg-success' : score > 0.5 ? 'bg-brand' : 'bg-slate-300'}`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Career Vectors (Preferences) */}
            {isSelf && (
              <div className="bg-white rounded-4xl p-10 shadow-soft border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-1 bg-warning h-6 rounded-full" />
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Career Vectors</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categories.map((c) => (
                    <div key={c} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 hover:bg-white transition-all group">
                      <div className="flex justify-between mb-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-warning">{c}</span>
                        <span className="text-xs font-bold text-warning">{Math.round((editablePrefs[c] || 0.5) * 100)}%</span>
                      </div>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        disabled={savingPrefs}
                        value={editablePrefs[c] ?? 0.5}
                        onChange={(e) => {
                          const next = { ...editablePrefs, [c]: Number(e.target.value) };
                          dev.preferences = next;
                          setProfile({ ...profile, profile: { ...dev } });
                        }}
                        onMouseUp={() => savePreferences(dev.preferences)}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-warning"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Operations */}
            {assignedIssues.length > 0 && (
              <div className="bg-slate-900 rounded-4xl p-10 shadow-premium border border-slate-800">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-1 bg-indigo-500 h-6 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Active Operations</h3>
                </div>

                <div className="space-y-6">
                  {assignedIssues.map((issue) => (
                    <div key={issue.id} className="p-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/[0.08] transition-all group">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${getPriorityStyles(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{issue.category}</span>
                        </div>
                        <h4 className="font-bold text-white text-base mb-2 uppercase tracking-tight group-hover:text-brand transition-colors">{issue.title}</h4>
                        <p className="text-xs text-slate-400 font-medium line-clamp-1 italic">"{issue.description}"</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {issue.status === 'assigned' ? (
                          <button
                            onClick={() => handleAcceptIssue(issue.id)}
                            disabled={!isSelf}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${isSelf
                              ? 'bg-brand text-white hover:bg-indigo-500 shadow-lg shadow-brand/20 active:scale-95'
                              : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                              }`}
                          >
                            Initiate Phase
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="px-6 py-2.5 bg-success/10 border border-success/20 rounded-xl">
                              <span className="text-[10px] font-bold text-success uppercase tracking-widest">In Progress</span>
                            </div>
                            {isSelf && (
                              <button
                                onClick={() => handleResolveIssue(issue.id)}
                                className="px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-success text-white hover:bg-emerald-500 shadow-lg shadow-success/20 active:scale-95"
                              >
                                Complete Unit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Accolades */}
            <div className="bg-slate-900 rounded-4xl p-8 shadow-premium border border-slate-800 group">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                <div className="w-10 h-10 bg-warning/10 text-warning rounded-xl flex items-center justify-center border border-warning/20 transition-transform group-hover:scale-110">
                  <Award size={20} />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Accolades</h3>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {(!dev.earnedBadges || dev.earnedBadges.length === 0) ? (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 w-full text-center py-6">No badges earned</p>
                ) : (
                  dev.earnedBadges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <Star size={12} className="text-warning fill-warning" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white">{badge}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resource Load */}
            <div className="bg-white rounded-4xl p-8 shadow-soft border border-slate-100 group">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-indigo-50 text-brand rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <Clock size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Resource Load</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Capacity</span>
                    <span className={`text-3xl font-bold tracking-tight ${dev.capacity_percentage < 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {dev.capacity_percentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${dev.capacity_percentage < 30 ? 'bg-rose-500' : 'bg-brand'}`}
                      style={{ width: `${dev.capacity_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stress</p>
                    <p className="text-xl font-bold text-slate-900">{dev.workload_score?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">State</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${dev.status?.toLowerCase() === 'busy' ? 'text-warning' : 'text-success'}`}>
                      {dev.status || 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-4xl p-8 shadow-soft border border-slate-100 group">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <FileCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Efficiency</h3>
              </div>

              <div className="mb-8">
                <p className="text-5xl font-bold text-slate-900 tracking-tight mb-1">
                  {Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Resolved</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commits</p>
                  <p className="text-xl font-bold text-slate-900">
                    {Object.values(dev.githubCommits || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precision</p>
                  <p className="text-xl font-bold text-brand">
                    {dev.efficiency ? Math.round(dev.efficiency * 100) : '94'}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isModal ? createPortal(
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-start justify-center z-[2147483647] p-4 pt-12 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-6xl mb-12">{content}</div>
    </div>,
    document.getElementById('portal-root') || document.body
  ) : content;
};

export default DeveloperProfileView;
