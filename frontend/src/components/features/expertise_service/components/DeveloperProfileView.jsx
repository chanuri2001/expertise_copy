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

  const handleAcceptIssue = async (issueId, category) => {
    try {
      const token = getAuthToken();
      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/${issueId}/accept?developerEmail=${encodeURIComponent(developerEmail)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh local state
      fetchAssignedIssues();
      fetchProfile();
      alert('Mission Accepted!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept mission.');
    }
  };

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
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
    <div className={`bg-[#F9FAFB] rounded-2xl shadow-xl w-full flex flex-col relative overflow-hidden ${isModal ? 'max-w-6xl max-h-[92vh] border border-slate-200' : ''}`}>
      {/* SaaS Header */}
      <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center shrink-0 relative z-10">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm overflow-hidden group">
              <User className="w-10 h-10 text-blue-600 transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-4 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{dev.name}</h2>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${dev.status?.toLowerCase() === 'active'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : dev.status?.toLowerCase() === 'busy'
                  ? 'bg-amber-50 border-amber-100 text-amber-600'
                  : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                {dev.status || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">{dev.email}</span>
              </div>
              <div className="h-3 w-px bg-slate-200 mx-1" />
              <div className="flex items-center gap-2 text-slate-500">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{dev.role || 'Developer'}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F9FAFB]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Skill Matrix & Preferences */}
          <div className="lg:col-span-8 space-y-8">

            {/* Expertise Areas */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Expertise Matrix
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Verified scores based on historical issue resolution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {categories.map((category) => {
                  const score = dev.expertise?.[category] || 0;
                  const isSelected = selectedCategory === category;

                  return (
                    <div
                      key={category}
                      className={`group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-[1.02]' : ''}`}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                    >
                      <div className="flex justify-between items-end mb-2.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                          {category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-900">{Math.round(score * 100)}%</span>
                      </div>
                      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${score > 0.8 ? 'bg-emerald-500' :
                            score > 0.5 ? 'bg-blue-600' :
                              'bg-slate-400'
                            }`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Preferences */}
            {!isBrief && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Individual Preferences
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Personal interest level in different issue categories</p>
                  </div>
                  {!isSelf && (
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      View Only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categories.map((c) => (
                    <div key={c} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors group">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{c}</span>
                        <span className="text-[10px] font-bold text-blue-600">{Math.round((editablePrefs[c] ?? 0.5) * 100)}%</span>
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
                        className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  ))}
                </div>

                {isSelf && (
                  <div className="mt-8 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      Your preferences help the Project Manager understand which tasks you find most engaging. This balances business needs with personal interests.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Active Assignments */}
            {!isBrief && assignedIssues.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                      Active Assignments
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Issues currently assigned to you</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {assignedIssues.map((issue) => (
                    <div key={issue.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{issue.category}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{issue.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {issue.status === 'assigned' ? (
                          <button
                            onClick={() => handleAcceptIssue(issue.id, issue.category)}
                            disabled={!isSelf}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSelf
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                          >
                            Accept Mission
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">In Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Statistics */}
          <div className="lg:col-span-4 space-y-8">
            {/* Resource Utilization (Workload) */}
            <div className={`bg-white rounded-2xl p-8 shadow-sm border p-8 transition-all ${dev.capacity_percentage < 30 ? 'border-rose-200 shadow-rose-900/5' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dev.capacity_percentage < 30 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Clock size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Resource Load</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Capacity</span>
                    <span className={`text-xl font-black ${dev.capacity_percentage < 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {dev.capacity_percentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${dev.capacity_percentage < 30 ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                      style={{ width: `${dev.capacity_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Workload Score</p>
                    <p className="text-xl font-bold text-slate-900">{dev.workload_score?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-[10px] font-black uppercase ${dev.status?.toLowerCase() === 'busy' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {dev.status || 'Active'}
                    </p>
                  </div>
                </div>

                {dev.capacity_percentage < 30 && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-700 font-bold uppercase leading-tight">Burnout Alert: Candidate is currently overloaded.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance card (Efficiency) */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Efficiency</h3>
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-slate-900 tracking-tighter">
                  {Object.values(dev.jiraIssuesSolved || {}).reduce((a, b) => a + b, 0)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issues Solved</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commits</p>
                  <p className="text-xl font-bold text-slate-900">
                    {Object.values(dev.githubCommits || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-xl font-bold text-slate-900">
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

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4 overflow-y-auto animate-in fade-in duration-300">
        {content}
      </div>
    );
  }

  return content;
};

export default DeveloperProfileView;

