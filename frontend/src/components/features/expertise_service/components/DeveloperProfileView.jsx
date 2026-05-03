import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, TrendingUp, CheckCircle, Clock, AlertCircle, FileCheck, LayoutDashboard, Star, Award, Zap, Shield, ChevronRight } from 'lucide-react';
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
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md transition-all hover:bg-white/10">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dev.status?.toLowerCase() === 'active' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">
                  {dev.status || 'Active'}
                </span>
              </div>
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
            {/* Accolades Section */}
            <div className="bg-white rounded-4xl p-8 shadow-soft border border-slate-100 group transition-all hover:shadow-premium relative overflow-hidden">
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-brand/10" />
              
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-none">Accolades</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Achievement Terminal</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-10">
                {(!dev.earnedBadges || dev.earnedBadges.length === 0) ? (
                  <div className="w-full py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No medals acquired</p>
                  </div>
                ) : (
                  dev.earnedBadges.map((badge, idx) => {
                    const isMaster = badge.toLowerCase().includes('master');
                    const isExpert = badge.toLowerCase().includes('expert');
                    const isSpecialist = badge.toLowerCase().includes('specialist');
                    
                    let badgeStyles = "bg-slate-50 text-slate-600 border-slate-200";
                    let BadgeIcon = Star;
                    
                    if (isMaster) {
                      badgeStyles = "bg-indigo-50/50 text-brand border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.05)]";
                      BadgeIcon = Zap;
                    } else if (isExpert) {
                      badgeStyles = "bg-amber-50/50 text-amber-600 border-amber-100 shadow-[0_0_15px_rgba(217,119,6,0.05)]";
                      BadgeIcon = Shield;
                    } else if (isSpecialist) {
                      badgeStyles = "bg-emerald-50/50 text-emerald-600 border-emerald-100 shadow-[0_0_15px_rgba(5,150,105,0.05)]";
                      BadgeIcon = Star;
                    }

                    return (
                      <div key={idx} className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border transition-all hover:scale-105 hover:bg-white hover:shadow-premium group/badge ${badgeStyles}`}>
                        <BadgeIcon size={14} className={`${isMaster ? "fill-brand/10" : isExpert ? "fill-amber-500/10" : "fill-emerald-500/10"} transition-transform group-hover/badge:rotate-12`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{badge}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Performance Milestone Tracker */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 rounded-full blur-[80px] -mr-24 -mt-24" />
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Milestone</h4>
                    <p className="text-sm font-bold text-white tracking-tight">Operational Lead</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-white">
                      {Math.round(Math.min(100, (Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0) / 25) * 100))}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                      {Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0)} / 25 UNITS
                    </span>
                  </div>
                </div>

                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner mb-8 relative z-10">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-brand rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0) / 25) * 100)}%` }}
                  />
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative z-10">
                    <div className="flex items-center gap-4 text-[9px] font-bold text-indigo-200 uppercase tracking-[0.2em] leading-relaxed">
                        <div className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 border border-indigo-500/20">
                            <ChevronRight size={14} />
                        </div>
                        <span>Secure {Math.max(0, 25 - Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0))} more units to unlock terminal elevation.</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Resource Load */}
            <div className="bg-white rounded-4xl p-8 shadow-soft border border-slate-100 group transition-all hover:shadow-premium">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-indigo-50 text-brand rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-indigo-100">
                  <Clock size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Resource Load</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacity</span>
                    <span className={`text-3xl font-black tracking-tight ${dev.capacity_percentage < 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {dev.capacity_percentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 shadow-sm ${dev.capacity_percentage < 30 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-indigo-500 to-brand'}`}
                      style={{ width: `${dev.capacity_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stress</p>
                    <p className="text-2xl font-black text-slate-900">{dev.workload_score?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">State</p>
                    <p className={`text-[11px] font-black uppercase tracking-widest ${dev.status?.toLowerCase() === 'busy' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {dev.status || 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Efficiency Stats Card */}
            <div className="bg-white rounded-4xl p-8 shadow-soft border border-slate-100 group transition-all hover:shadow-premium">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-emerald-100">
                  <FileCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Efficiency</h3>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black text-slate-900 tracking-tighter">
                    {Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Resolved</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group-hover:bg-white transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commits</p>
                  <p className="text-2xl font-black text-slate-900">
                    {Object.values(dev.githubCommits || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 group-hover:bg-white transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precision</p>
                  <p className="text-2xl font-black text-brand">
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
