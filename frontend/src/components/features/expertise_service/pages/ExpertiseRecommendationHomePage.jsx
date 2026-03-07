import React, { useState, useEffect } from 'react';
import { Users, FileText, LayoutDashboard, ShieldCheck, CheckCircle, Clock, Search, AlertTriangle, ArrowRight, User, Eye, Lightbulb } from 'lucide-react';
import axios from 'axios';
import DeveloperProfileView from '../components/DeveloperProfileView';
import ProjectManagerDashboard from './ProjectManagerDashboard';
import AuthPanel from '../components/AuthPanel';
import { getAuthToken, getCurrentUser } from '../utils/userContext';
import ErrorBoundary from '../components/ErrorBoundary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ExpertiseRecommendationHomePage = ({ module }) => {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'dashboard', 'missions'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictedCategory, setPredictedCategory] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [submitterEmailForProfile, setSubmitterEmailForProfile] = useState(null);
  const [assigningIssue, setAssigningIssue] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [lastCreatedIssue, setLastCreatedIssue] = useState(null);
  const [viewingMissionId, setviewingMissionId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [systemConfig, setSystemConfig] = useState({ categories: [], organization: 'AgileSense AI' });

  // Get logged-in User and system config on component mount
  useEffect(() => {
    const User = getCurrentUser();
    setCurrentUser(User);
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL} /api/expertise / config`);
      setSystemConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch system config', err);
    }
  };

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token} ` } : {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setPredictedCategory('');
    setRecommendations([]);
    setLastCreatedIssue(null);

    if (!description.trim()) {
      setError('Please enter an Objective Description.');
      return;
    }

    if (!currentUser?.email) {
      setError('Please login to submit an issue (so we can track your profile and history).');
      return;
    }

    try {
      setLoading(true);
      const issueRes = await axios.post(`${API_BASE_URL}/api/expertise/issues`, {
        title: title || `Issue in ${new Date().toLocaleDateString()}`,
        description,
        submittedBy: currentUser?.email || '',
        submittedByName: currentUser?.name || 'Anonymous',
        priority: priority,
      }, { headers: authHeaders() });

      const issue = issueRes.data;
      setLastCreatedIssue(issue);
      setPredictedCategory(issue.category);

      // Extract top experts from issue - Set immediately for maximum speed
      if (issue.topExperts) {
        setRecommendations(issue.topExperts);
      }

      setSuccessMessage('Issue created successfully! It will appear on the Project Manager dashboard.');
      setTimeout(() => setSuccessMessage(''), 5000);

      // Clear form
      setTitle('');
      setDescription('');
      setPriority('medium');
    } catch (err) {
      console.error('Submission Error:', err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => d.msg).join(', ')
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignIssue = async (developerEmail, developerName) => {
    if (!lastCreatedIssue?.id) {
      setError('Please submit an issue first so we can assign the created issue.');
      return;
    }

    try {
      setAssigningIssue({ ...assigningIssue, [developerEmail]: true });
      setError('');
      setSuccessMessage('');

      // Assign the actual created issue (updates main issue + developer pending issues)
      await axios.post(
        `${API_BASE_URL} /api/expertise / issues / assign`,
        {
          issueId: lastCreatedIssue.id,
          developerEmail,
          developerName,
        },
        { headers: authHeaders() }
      );

      setSuccessMessage(`Issue assigned to ${developerName} !Check their profile to see it.`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to Assign Mission. Please try again.');
    } finally {
      setAssigningIssue({ ...assigningIssue, [developerEmail]: false });
    }
  };

  const isManager = currentUser?.role === 'manager';

  const handleNotificationClick = (issueId) => {
    console.log('DEBUG [Home]: Notification event received for:', issueId);

    // Display the modal securely directly over the current tab
    // We intentionally DO NOT switch tabs here, because switching to 'missions' 
    // for a test user without a full profile renders an "Access Denied" empty page.
    setviewingMissionId(issueId);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-black text-black">{module.name}</h1>
            <p className="text-xs text-gray-600">Developer: {module.developer}</p>
          </div>
        </div>
      </div>

      {/* Auth & Notifications (Global Header) */}
      <div className="sticky top-0 z-40 pb-4 bg-gray-50/80 backdrop-blur-sm -mx-6 px-6 space-y-2">
        <AuthPanel
          onAuthChanged={(u) => setCurrentUser(u)}
          onNotificationClick={handleNotificationClick}
        />
        {/* Temporary Debug Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              // Prompt for an ID or just use a known test one if possible
              const id = window.prompt("Enter Issue ID to test briefing (e.g. ISSUE-20260307-...)");
              if (id) handleNotificationClick(id);
            }}
            className="text-[10px] font-bold text-blue-500 hover:underline"
          >
            [DEBUG: Test Mission Briefing Modal]
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px - 4 py - 2 text - sm font - medium border - b - 2 transition - colors ${activeTab === 'submit'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            } `}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Raise Mission
        </button>
        {!isManager && (
          <button
            onClick={() => setActiveTab('missions')}
            className={`px - 4 py - 2 text - sm font - medium border - b - 2 transition - colors ${activeTab === 'missions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              } `}
          >
            <ShieldCheck className="w-4 h-4 inline mr-2" />
            My Missions
          </button>
        )}
        {isManager && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px - 4 py - 2 text - sm font - medium border - b - 2 transition - colors ${activeTab === 'dashboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              } `}
          >
            <LayoutDashboard className="w-4 h-4 inline mr-2" />
            Project Manager Dashboard
          </button>
        )}
      </div>

      {activeTab === 'dashboard' ? (
        <ProjectManagerDashboard refreshTrigger={refreshTrigger} />
      ) : activeTab === 'missions' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DeveloperProfileView
            developerEmail={currentUser?.email}
            isSubmitter={false}
            isModal={false}
            onClose={() => setActiveTab('submit')}
          />
        </div>
      ) : (
        <div className="space-y-6">

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 max-w-3xl"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Eg: API returns 500 error when updating User profile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Urgency (Priority)
              </label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex - 1 py - 2 px - 3 rounded - lg text - xs font - black uppercase tracking - widest border transition - all ${priority === p
                      ? p === 'critical' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' :
                        p === 'high' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' :
                          p === 'medium' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' :
                            'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                      } `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objective Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the detailed Jira Objective Description here..."
              />
            </div>


            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {successMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Predict & Recommend Experts'}
            </button>
          </form>

          {predictedCategory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-w-3xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Predicted category</p>
                  <p className="text-xl font-semibold text-blue-700">{predictedCategory}</p>
                </div>
                {currentUser?.email && (
                  <button
                    onClick={() => setSubmitterEmailForProfile(currentUser.email)}
                    className="inline-flex items-center px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <User className="w-4 h-4 mr-2" />
                    View My Profile
                  </button>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Recommended developers for this issue
                </p>

                {recommendations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No developer profiles found yet. Add profiles through the backend API to see
                    recommendations.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {recommendations.map((dev) => {
                      // Support both full profile objects and lightweight recommendation summaries
                      const expertiseScore = dev.expertiseScore !== undefined
                        ? dev.expertiseScore
                        : (dev.expertise?.[predictedCategory] ?? 0);

                      const pendingCount = dev.pending_count || 0;
                      const isOverloaded = pendingCount > 5;
                      const isPreference = dev.recommendation_reason === 'preference';

                      const totalSolutions = dev.expertiseScore !== undefined
                        ? (dev.jiraIssuesSolved + dev.githubCommits)
                        : (dev.jiraIssuesSolved?.[predictedCategory] || 0) + (dev.githubCommits?.[predictedCategory] || 0);

                      const isAssigning = assigningIssue[dev.email] || false;

                      return (
                        <div
                          key={dev.email}
                          className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all hover:-translate-y-1 group flex flex-col relative overflow-hidden h-full"
                        >
                          {/* Top accent */}
                          <div className={`absolute top - 0 left - 0 w - full h - 1.5 ${isPreference ? 'bg-purple-500' : 'bg-blue-600'} `} />

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w - 14 h - 14 rounded - 2xl flex items - center justify - center border transition - all duration - 500 ${isPreference
                                ? 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-6 shadow-purple-100'
                                : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 shadow-blue-100'
                                } `}>
                                <User className="w-7 h-7" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors truncate">{dev.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase truncate">{dev.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Technical Metrics - Only visible to managers */}
                          {isManager && (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center flex flex-col justify-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Mastery</p>
                                <p className={`text - xl font - black ${(expertiseScore * 100) > 80 ? 'text-emerald-600' : 'text-slate-900'} `}>
                                  {Math.round(expertiseScore * 100)}%
                                </p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center flex flex-col justify-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Active</p>
                                <p className={`text - xl font - black ${isOverloaded ? 'text-orange-500' : 'text-slate-900'} `}>
                                  {pendingCount}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Historical Performance - Only visible to managers */}
                          {isManager && (
                            <div className="space-y-3 mb-6 flex-1">
                              <div className="bg-white/50 p-4 rounded-2xl border border-slate-50 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Historical Performance</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-600">Total Validations</span>
                                  <span className="text-xs font-black text-slate-900">
                                    {totalSolutions}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              {isPreference ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                  <Lightbulb className="w-3.5 h-3.5" /> Interested
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Authority
                                </span>
                              )}

                              {isManager && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeveloper(dev.email);
                                  }}
                                  className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
                                >
                                  Briefing <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {isManager && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOverloaded) handleAssignIssue(dev.email, dev.name);
                                }}
                                disabled={isAssigning || isOverloaded}
                                className={`w - full py - 4 rounded - 2xl font - black text - xs uppercase tracking - widest transition - all shadow - xl active: scale - 95 ${isOverloaded
                                  ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed shadow-none'
                                  : 'bg-slate-900 text-white hover:bg-black shadow-slate-200 hover:shadow-blue-500/20'
                                  } `}
                              >
                                {isAssigning ? 'Assigning...' : (isOverloaded ? 'Overloaded' : 'Assign Mission')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Modals */}
      {selectedDeveloper && (
        <DeveloperProfileView
          developerEmail={selectedDeveloper}
          onClose={() => setSelectedDeveloper(null)}
          isBrief={!isManager}
          submitterRole={currentUser?.role}
        />
      )}

      {/* Submitter Profile Modal */}
      {submitterEmailForProfile && (
        <DeveloperProfileView
          developerEmail={submitterEmailForProfile}
          onClose={() => setSubmitterEmailForProfile(null)}
          isSubmitter={true}
          submitterName={currentUser?.name}
          submitterRole={currentUser?.role}
          isBrief={false}
        />
      )}

      {/* Notification Mission Briefing Modal */}
      {viewingMissionId && (
        <NotificationIssueViewModal
          issueId={viewingMissionId}
          onClose={() => setviewingMissionId(null)}
          onResolved={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

div, h1, h2, h3, h4, h5, p, span, button, input, textarea {
  font - family: 'Inter', sans - serif!important;
}

        .custom - scrollbar:: -webkit - scrollbar {
  width: 8px;
}
        .custom - scrollbar:: -webkit - scrollbar - track {
  background: transparent;
}
        .custom - scrollbar:: -webkit - scrollbar - thumb {
  background: #e2e8f0;
  border - radius: 10px;
}
        .custom - scrollbar:: -webkit - scrollbar - thumb:hover {
  background: #cbd5e1;
}
`}</style>
    </div>
  );
};

/**
 * Modern Mission Briefing Modal for deep-linked notifications
 */
const NotificationIssueViewModal = ({ issueId, onClose, onResolved }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      console.error('CRITICAL DEBUG [Modal]: Component mounted with issueId:', issueId, 'Type:', typeof issueId);
      try {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        const url = `${API_BASE_URL} /api/expertise / issues / ${String(issueId).trim()} `;
        console.log('DEBUG [Modal]: Requesting URL:', url);

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token} ` },
          timeout: 10000
        });

        console.log('DEBUG [Modal]: Received response:', res.data);

        if (!res.data || !res.data.id) {
          console.error('DEBUG [Modal]: Mission data is invalid!', res.data);
          throw new Error('Mission data not found or invalid.');
        }
        setIssue(res.data);
      } catch (err) {
        console.error('DEBUG [Modal]: Failed to load Mission Briefings:', err);
        setError(`Failed to load Mission Briefings: ${err.message} `);
      } finally {
        setLoading(false);
        console.log('DEBUG [Modal]: Fetch complete, loading state false');
      }
    };
    if (issueId) fetchIssue();
  }, [issueId]);

  const handleMarkAsFixed = async (status = 'resolved') => {
    try {
      const noteToSubmit = status === 'blocked' ? `[BLOCKED] ${resolutionNote} ` : resolutionNote;

      if (!resolutionNote.trim()) {
        alert('Please provide a brief summary for the Project Manager.');
        return;
      }
      setIsResolving(true);
      const token = getAuthToken();
      const User = getCurrentUser();

      await axios.post(
        `${API_BASE_URL} /api/expertise / issues / ${issueId}/complete?developerEmail=${encodeURIComponent(User.email)}&resolutionNote=${encodeURIComponent(noteToSubmit)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onResolved?.();
      onClose();
      alert(status === 'blocked' ? 'Mission marked as Blocked.' : 'Success! The mission has been marked as resolved.');
    } catch (err) {
      console.error('Finalize Mission Error:', err);
      alert(err.response?.data?.detail || 'Failed to update Mission status. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  if (!issueId) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-50 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] max-w-4xl w-full overflow-hidden border border-white/40 flex flex-col max-h-[92vh] relative">
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 z-0" />

          {/* ... Modal Header ... */}
          <div className="px-10 pt-10 pb-8 flex justify-between items-start shrink-0 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-xl">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-[9px] font-black uppercase text-blue-200 tracking-wider">
                    Mission Briefing
                  </span>
                  <span className="text-white/40 text-[10px] font-mono">ID: {String(issueId).slice(-8)}</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Mission Briefing</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all hover:rotate-90 duration-300 backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-10 pb-10 flex-1 overflow-y-auto custom-scrollbar -mt-2">
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-[6px] border-slate-100 rounded-full" />
                  <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-wider text-[11px] animate-pulse">Loading Mission Briefings...</p>
              </div>
            ) : error ? (
              <div className="mt-8 bg-red-950/10 border border-red-500/20 p-8 rounded-[2rem] flex flex-col items-center text-center gap-6 text-red-700 shadow-2xl">
                <div className="p-4 bg-red-100 rounded-3xl shadow-lg border border-red-200">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-2xl tracking-tight text-slate-900">Feed Interrupted</h4>
                  <p className="text-sm font-medium opacity-60 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Retry
                </button>
              </div>
            ) : issue ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="lg:col-span-7 space-y-10">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative group hover:shadow-2xl hover:shadow-blue-500/[0.03] transition-all duration-500">
                      <div className="mb-10">
                        <div className="flex gap-3 mb-6">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            {issue.category}
                          </span>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${issue.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {issue.priority || 'Standard'} Priority
                          </span>
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                          {issue.title}
                        </h4>
                        <div className="space-y-4 pt-10 border-t border-slate-50">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Objective Description</p>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Live Document</span>
                          </div>
                          <p className="text-slate-700 text-lg leading-relaxed font-medium selection:bg-blue-100 italic">
                            "{issue.description}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-50">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raised By</p>
                              <p className="text-sm font-black text-slate-900">{issue.submittedByName || 'Client'}</p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{issue.submittedBy}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Assigned By</p>
                              <p className="text-sm font-black text-slate-900">Project Manager</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                              <p className="text-sm font-black text-slate-900">
                                {(() => {
                                  try {
                                    if (!issue.createdAt) return 'Recent';
                                    const d = new Date(issue.createdAt);
                                    return isNaN(d) ? 'Recent' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                                  } catch (e) {
                                    return 'Recent';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="bg-slate-100/50 rounded-[2rem] p-6 border border-slate-200/50 flex items-center gap-6 group">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 group-hover:rotate-6 transition-transform">
                        <div className="w-full h-full bg-slate-900 rounded-[1.4rem] flex items-center justify-center">
                          <User className="text-white w-7 h-7" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Assigned To</p>
                        <p className="text-xl font-black text-slate-900 leading-none">Mission Control</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-10">
                          <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                          <h3 className="text-[12px] font-black text-white tracking-widest uppercase">Resolution Intel</h3>
                        </div>

                        {issue.status !== 'resolved' ? (
                          <div className="flex flex-col h-full gap-8">
                            <div className="flex-1 flex flex-col">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Intel Log & Fix Summary</label>
                              <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Enter resolution details..."
                                className="flex-1 w-full p-8 rounded-[2rem] bg-white/[0.03] border-2 border-white/5 text-white text-md font-medium placeholder:text-slate-700 focus:bg-white/[0.06] focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you cannot resolve this mission? It will be marked as blocked and the PM will be notified.')) {
                                    handleMarkAsFixed('blocked');
                                  }
                                }}
                                disabled={isResolving}
                                className="py-6 bg-slate-800 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 disabled:opacity-50"
                              >
                                Can't Resolve
                              </button>
                              <button
                                onClick={handleMarkAsFixed}
                                disabled={isResolving}
                                className="py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-3xl shadow-black group/btn active:scale-95 disabled:opacity-20 translate-y-0 hover:-translate-y-1"
                              >
                                {isResolving ? (
                                  <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    Resolved Mission <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] p-10 flex flex-col items-center text-center gap-8 shadow-2xl">
                            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500/40 flex items-center justify-center animate-pulse">
                              <ShieldCheck className="text-emerald-400 w-12 h-12" />
                            </div>
                            <div>
                              <h4 className="text-2xl font-black text-white tracking-tight mb-4">Deployment Successful</h4>
                              <p className="text-emerald-100/60 text-sm font-medium leading-relaxed italic border-t border-white/5 pt-8">
                                "{issue.resolutionNote}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-6 rounded-[2rem] border-2 border-slate-100 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-slate-50 transition-all hover:text-slate-600 active:scale-95 mt-10"
                >
                  Exit Briefing
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
export default ExpertiseRecommendationHomePage;
