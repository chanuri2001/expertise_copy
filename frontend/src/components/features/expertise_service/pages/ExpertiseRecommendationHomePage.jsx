import React, { useState, useEffect } from 'react';
import { Users, FileText, LayoutDashboard, ShieldCheck, CheckCircle, Clock, Search, AlertTriangle, ArrowRight, User, Eye, Lightbulb, X, Brain } from 'lucide-react';
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
  const [viewingIssueId, setViewingIssueId] = useState(null);
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
      const res = await axios.get(`${API_BASE_URL}/api/expertise/config`);
      setSystemConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch system config', err);
    }
  };

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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

      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/assign`,
        {
          issueId: lastCreatedIssue.id,
          developerEmail,
          developerName,
        },
        { headers: authHeaders() }
      );

      setSuccessMessage(`Issue assigned to ${developerName}! Check their profile to see it.`);
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
    setViewingIssueId(issueId);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-blue-100 italic-none">
      {/* SaaS Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Expertise Recommendation System</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{systemConfig.organization || 'AgileSense AI'}</p>
            </div>
          </div>

          <AuthPanel
            onAuthChanged={(u) => setCurrentUser(u)}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-10 w-fit">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'submit'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <FileText size={18} />
            Raise Issue
          </button>
          {!isManager && (
            <button
              onClick={() => setActiveTab('missions')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'missions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <User size={18} />
              My Profile
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LayoutDashboard size={18} />
              PM Dashboard
            </button>
          )}
        </div>

        {activeTab === 'dashboard' ? (
          <ProjectManagerDashboard refreshTrigger={refreshTrigger} />
        ) : activeTab === 'missions' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DeveloperProfileView
              developerEmail={currentUser?.email}
              isSubmitter={false}
              isModal={false}
              onClose={() => setActiveTab('submit')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Submit Form */}
            <div className="lg:col-span-12 xl:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sticky top-28">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Report New Issue</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Provide details to identify the most suitable expert</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Issue Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
                      placeholder="e.g., Memory leak in auth microservice"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Severity</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['low', 'medium', 'high', 'critical'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${priority === p
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                      placeholder="Provide a detailed description of the problem..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Brain size={18} />
                    )}
                    Predict & Recommend Experts
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Results Section */}
            <div className="lg:col-span-12 xl:col-span-7">
              {!predictedCategory && !loading && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                    <Search size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Awaiting Data</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                    Fill in the issue details and click analyze to see predicted categories and expert recommendations.
                  </p>
                </div>
              )}

              {loading && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-10 text-center animate-pulse">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
                    <Brain size={40} className="animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Analyzing Complexity...</h3>
                  <p className="text-sm text-slate-500 mt-2">Our AI is mapping your issue to the optimal expertise areas.</p>
                </div>
              )}

              {predictedCategory && !loading && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                  {/* Category Card */}
                  <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-1000" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Predicted Issue Category</p>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          <h3 className="text-3xl font-black tracking-tight uppercase">{predictedCategory}</h3>
                        </div>
                      </div>
                      {currentUser?.email && (
                        <button
                          onClick={() => setSubmitterEmailForProfile(currentUser.email)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors backdrop-blur-sm"
                        >
                          View My Expertise
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recommendation List */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        Recommended Experts
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">MATCHED BY AI</span>
                    </div>

                    {recommendations.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                        <p className="text-sm text-slate-500 font-medium italic">No suitable experts found for this specific category yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map((dev) => {
                          const expertiseScore = dev.expertiseScore !== undefined
                            ? dev.expertiseScore
                            : (dev.expertise?.[predictedCategory] ?? 0);

                          const pendingCount = dev.pending_count || 0;
                          const isOverloaded = pendingCount > 5;
                          const isPreference = dev.recommendation_reason === 'preference';

                          return (
                            <div
                              key={dev.email}
                              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all hover:-translate-y-1 group flex flex-col h-full"
                            >
                              <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                                  <User size={24} />
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Expertise</p>
                                  <p className={`text-lg font-black tracking-tight ${expertiseScore > 0.8 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {Math.round(expertiseScore * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1 mb-6">
                                <h4 className="font-bold text-slate-900 text-md truncate group-hover:text-blue-600 transition-colors">{dev.name}</h4>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{dev.email}</p>

                                <div className="mt-4 flex flex-wrap gap-1.5">
                                  {isPreference && (
                                    <span className="bg-purple-50 text-purple-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-purple-100">STATED INTEREST</span>
                                  )}
                                  {isOverloaded ? (
                                    <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-red-100">BUSY</span>
                                  ) : (
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">AVAILABLE</span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3 pt-6 border-t border-slate-50">
                                {isManager ? (
                                  <button
                                    onClick={() => handleAssignIssue(dev.email, dev.name)}
                                    disabled={assigningIssue[dev.email] || isOverloaded}
                                    className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isOverloaded || assigningIssue[dev.email]
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-md shadow-slate-200'
                                      }`}
                                  >
                                    {assigningIssue[dev.email] ? 'Assigning...' : 'Assign Task'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedDeveloper(dev.email)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                  >
                                    View Expert Profile
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
          </div>
        )}
      </main>

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

      {/* Notification Issue Briefing Modal */}
      {viewingIssueId && (
        <ErrorBoundary>
          <NotificationIssueViewModal
            issueId={viewingIssueId}
            onClose={() => setViewingIssueId(null)}
            onResolved={() => setRefreshTrigger(prev => prev + 1)}
          />
        </ErrorBoundary>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        div, h1, h2, h3, h4, h5, p, span, button, input, textarea {
          font-family: 'Inter', sans-serif !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
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
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError('');
        const token = getAuthToken();
        const url = `${API_BASE_URL}/api/expertise/issues/${String(issueId).trim()}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data || !res.data.id) {
          throw new Error('Issue data not found.');
        }
        setIssue(res.data);
      } catch (err) {
        setError(`Failed to load issue details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (issueId) fetchIssue();
  }, [issueId]);

  const handleMarkAsFixed = async (status = 'resolved') => {
    try {
      const noteToSubmit = status === 'blocked' ? `[BLOCKED] ${resolutionNote}` : resolutionNote;

      if (!resolutionNote.trim()) {
        alert('Please provide a brief summary of the resolution.');
        return;
      }
      setIsResolving(true);
      const token = getAuthToken();
      const User = getCurrentUser();

      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/${issueId}/complete?developerEmail=${encodeURIComponent(User.email)}&resolutionNote=${encodeURIComponent(noteToSubmit)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onResolved?.();
      onClose();
      alert(status === 'blocked' ? 'Issue marked as Blocked.' : 'Issue successfully resolved.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAcceptMission = async () => {
    try {
      setIsAccepting(true);
      const token = getAuthToken();
      const User = getCurrentUser();

      await axios.post(
        `${API_BASE_URL}/api/expertise/issues/${issueId}/accept?developerEmail=${encodeURIComponent(User.email)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh issue data locally
      const res = await axios.get(`${API_BASE_URL}/api/expertise/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssue(res.data);

      onResolved?.(); // This triggers refresh in parent if needed
      alert('Mission Accepted! Status is now In Progress.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept mission.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!issueId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
      <div className="bg-slate-50 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] max-w-5xl w-full max-h-[92vh] overflow-hidden border border-white/40 flex flex-col relative">

        {/* Header Section */}
        <div className="relative px-10 pt-10 pb-12 shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/20 border border-white/30 rounded-full text-[10px] font-black uppercase text-white tracking-widest">
                    Issue Review
                  </span>
                  <span className="text-white/50 text-[10px] font-mono">ID: {String(issueId).split('-').pop()}</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                  {issue?.title || 'Loading Issue...'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white transition-all duration-300 backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 -mt-6 custom-scrollbar">
          {loading ? (
            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center shadow-xl border border-slate-100">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Data Terminal...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-[2rem] p-16 text-center shadow-xl border border-slate-100">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6 opacity-20" />
              <p className="text-sm font-bold text-slate-600 mb-8">{error}</p>
              <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Close Portal</button>
            </div>
          ) : issue ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Context & Metadata */}
              <div className="lg:col-span-7 space-y-8">
                <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-200 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />

                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-0.5 bg-blue-600/30" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Description</h4>
                    </div>
                    <p className="text-slate-800 text-lg leading-relaxed font-semibold">
                      {issue.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Core Category</h4>
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-xs">
                        {issue.category}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Workflow Status</h4>
                      <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border font-bold text-xs uppercase ${issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                        {issue.status}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Submitted By</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                          {issue.submittedByName?.charAt(0) || 'U'}
                        </div>
                        <p className="text-xs font-bold text-slate-900">{issue.submittedByName}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Reported On</h4>
                      <p className="text-xs font-bold text-slate-900">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                      <User size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Assigned Expert</p>
                      <p className="text-xl font-bold text-slate-900">{issue.assignedToName || 'Awaiting Sync'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Resolution Actions */}
              <div className="lg:col-span-5 h-full">
                <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Resolution Terminal</h3>
                  </div>

                  {issue.status !== 'resolved' ? (
                    <div className="flex-1 flex flex-col">
                      <div className="mb-6 flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Action Debrief & Fix Summary</label>
                        <textarea
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Describe the technical resolution..."
                          className="w-full h-64 p-6 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:bg-white/[0.08] focus:border-blue-500 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-4">
                        {issue.status === 'assigned' && (
                          <button
                            onClick={handleAcceptMission}
                            disabled={isAccepting}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-20 shadow-xl mb-4"
                          >
                            {isAccepting ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Accept Mission <ArrowRight size={18} /></>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsFixed('resolved')}
                          disabled={isResolving || issue.status === 'assigned'}
                          className={`w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl ${issue.status === 'assigned' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-50'}`}
                        >
                          {isResolving ? (
                            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>Confirm Final Fix <CheckCircle size={18} /></>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Mark this issue as blocked?')) {
                              handleMarkAsFixed('blocked');
                            }
                          }}
                          disabled={isResolving}
                          className="w-full py-4 text-slate-400 hover:text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 active:scale-[0.98]"
                        >
                          Mark as Blocked
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle size={40} />
                      </div>
                      <h4 className="text-white font-black text-xl mb-4">Verification Success</h4>
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-8">This issue has been closed</p>
                      <div className="bg-white/5 rounded-2xl p-6 border border-white/5 w-full">
                        <p className="text-sm text-slate-400 italic leading-relaxed">"{issue.resolutionNote}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExpertiseRecommendationHomePage;
