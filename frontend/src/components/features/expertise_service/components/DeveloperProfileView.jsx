import React, { useState, useEffect } from 'react';
import { X, User, Mail, TrendingUp, CheckCircle, Clock, AlertCircle, FileCheck, LayoutDashboard, Star } from 'lucide-react';
import axios from 'axios';
import { getAuthToken, getCurrentUser } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const [pendingIssues, setPendingIssues] = useState([]);
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [resolvingIssue, setResolvingIssue] = useState({});
  const [completingIssue, setCompletingIssue] = useState({});
  const [resolutionNotes, setResolutionNotes] = useState({}); // { issueId: note }
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefError, setPrefError] = useState('');
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

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      fetchPendingIssues(selectedCategory);
      fetchResolvedIssues(selectedCategory);
    } else {
      setPendingIssues([]);
      setResolvedIssues([]);
    }
  }, [selectedCategory, developerEmail, categories]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/expertise/developers/${developerEmail}/detail`);
      setProfile(response.data);
    } catch (err) {
      // If profile doesn't exist and this is a submitter or the user themselves, try to create it
      if ((isSubmitter || isSelf) && err.response?.status === 404) {
        try {
          // Use current user info if available
          const nameToUse = submitterName || sessionUser?.name || developerEmail.split('@')[0];
          await axios.post(`${API_BASE_URL}/api/expertise/create-submitter-profile`, null, {
            params: { email: developerEmail, name: nameToUse }
          });
          // Retry fetching
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
    setPrefError('');
    setSavingPrefs(true);
    try {
      // Send full preferences object (backend validates 0..1)
      await axios.put(`${API_BASE_URL}/api/expertise/me/preferences`, prefs, { headers: authHeaders() });
      await fetchProfile();
    } catch (err) {
      setPrefError(err.response?.data?.detail || 'Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const fetchPendingIssues = async (category) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/expertise/developers/${developerEmail}/pending-issues/${category}`
      );
      setPendingIssues(response.data || []);
    } catch (err) {
      setPendingIssues([]);
    }
  };

  const fetchResolvedIssues = async (category) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/expertise/developers/${developerEmail}/resolved-issues/${category}`
      );
      setResolvedIssues(response.data || []);
    } catch (err) {
      setResolvedIssues([]);
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

  // Note: handleMarkAsDone and handleResolveIssue were removed because the 
  // Active Workflow UI is no longer present on this profile view. 
  // All issue resolution actions now happen in the NotificationIssueViewModal.

  const getExpertiseColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-blue-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    const loadingContent = (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Intel...</p>
      </div>
    );
    if (isModal) {
      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[2rem] p-10 shadow-2xl border border-white/20">
            {loadingContent}
          </div>
        </div>
      );
    }
    return loadingContent;
  }

  if (error || !profile) {
    const errorContent = (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-6">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-900 tracking-tight">Access Denied</h4>
          <p className="text-sm text-slate-500 font-medium mt-1">{error || 'Profile not found'}</p>
        </div>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          Exit Briefing
        </button>
      </div>
    );
    if (isModal) {
      return (
        <div className="absolute inset-0 bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-slate-200 max-w-sm w-full">
            {errorContent}
          </div>
        </div>
      );
    }
    return errorContent;
  }

  const dev = profile.profile;
  const prefs = dev.preferences || {};

  // Dynamically build prefs from categories
  const editablePrefs = {};
  categories.forEach(cat => {
    editablePrefs[cat] = prefs[cat] ?? 0.5;
  });

  const content = (
    <div className={`bg-slate-50 rounded-[2.5rem] shadow-2xl w-full flex flex-col relative overflow-hidden ${isModal ? 'max-w-6xl max-h-[92vh] border border-white/20' : ''}`}>
      {/* Decorative background accent */}
      <div className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 z-0 ${!isModal ? 'rounded-t-[2.5rem]' : ''}`} />

      {/* Header */}
      <div className="p-8 pb-12 flex justify-between items-start shrink-0 relative">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden group">
              <User className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight relative z-10">{dev.name}</h2>
              <span className={`px-3 py-1 backdrop-blur-md border rounded-full text-[10px] font-black uppercase tracking-widest ${dev.status?.toLowerCase() === 'active'
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                : dev.status?.toLowerCase() === 'busy'
                  ? 'bg-orange-500/20 border-orange-400/30 text-orange-200'
                  : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                }`}>
                {dev.status || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-blue-100/70 hover:text-white transition-colors cursor-pointer group">
                <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{dev.email}</span>
              </div>
              <div className="h-4 w-px bg-white/10 mx-1" />
              <div className="flex items-center gap-2 text-blue-100/70">
                <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider text-[11px] font-black">{dev.role || 'Developer'}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all hover:rotate-90 duration-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-8 pt-0 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Skill Matrix & Preferences */}
          <div className="lg:col-span-8 space-y-8">

            {/* Modern Skill Bars */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover/card:scale-150 duration-1000" />

              <div className="relative">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      Intelligence Matrix
                    </h3>
                    <p className="text-sm text-slate-400 font-medium">Verified expertise and system activity scores</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {categories.map((category) => {
                    const score = dev.expertise?.[category] || 0;
                    const isSelected = selectedCategory === category;

                    return (
                      <div
                        key={category}
                        className={`group/skill cursor-pointer transition-all ${isSelected ? 'scale-105' : ''}`}
                        onClick={() => setSelectedCategory(isSelected ? null : category)}
                      >
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-black text-slate-700 tracking-tight group-hover/skill:text-blue-600 transition-colors uppercase text-[11px] tracking-[0.1em]">
                            {category}
                          </span>
                          <span className="text-xs font-black text-slate-900">{Math.round(score * 100)}%</span>
                        </div>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${score > 0.8 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                              score > 0.5 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' :
                                'bg-gradient-to-r from-slate-400 to-slate-300'
                              }`}
                            style={{ width: `${score * 100}%` }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preferences Slider Overhaul - Hidden in Brief Mode */}
            {!isBrief && (
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group/prefs">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mb-32 -mr-32 blur-3xl group-hover/prefs:bg-blue-600/20 transition-colors duration-1000" />

                <div className="relative">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                        Interest Trajectories
                      </h3>
                      <p className="text-sm text-slate-400 font-medium mt-1">Self-stated preferences for recommendation targeting</p>
                    </div>
                    {!isSelf && (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                        ReadOnly
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((c) => (
                      <div key={c} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors group/pitem">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{c}</span>
                          <span className="text-xs font-black text-blue-400">{Math.round((editablePrefs[c] ?? 0.5) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          disabled={!isSelf || savingPrefs}
                          value={editablePrefs[c] ?? 0.5}
                          onChange={(e) => {
                            const next = { ...editablePrefs, [c]: Number(e.target.value) };
                            dev.preferences = next;
                            setProfile({ ...profile, profile: { ...dev } });
                          }}
                          onMouseUp={() => savePreferences(dev.preferences)}
                          className="w-full accent-blue-500 h-1 rounded-full cursor-pointer appearance-none bg-white/10"
                        />
                      </div>
                    ))}
                  </div>
                  {isSelf && (
                    <div className="mt-8 flex items-center gap-3 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                      <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs">!</div>
                      <p className="text-xs text-blue-200 font-medium">Your preferences influence which expert teams you are recommended to join. Adjusting these helps balance your workload with tasks you find interesting.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Stats & Issue Activity */}
          <div className="lg:col-span-4 space-y-8">

            {/* Quick Summary Stats */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Total Solutions</h4>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0)}
                </span>
                <span className="text-sm font-black text-slate-400 mb-2">Verified Tasks</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Commits</p>
                  <p className="text-lg font-black text-slate-800">
                    {Object.values(dev.githubCommits || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Efficiency</p>
                  <p className="text-lg font-black text-slate-800">
                    {dev.efficiency ? Math.round(dev.efficiency * 100) : '94'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Removed Issue Interaction Area as per user request to solely use notification modal */}

          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto animate-in fade-in duration-300">
        {content}
      </div>
    );
  }

  return content;
};

export default DeveloperProfileView;

