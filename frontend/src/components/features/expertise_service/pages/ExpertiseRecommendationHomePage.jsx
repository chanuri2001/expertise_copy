import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, FileText, LayoutDashboard, ShieldCheck, CheckCircle, Clock, Search, AlertTriangle, ArrowRight, User, Eye, Lightbulb, X, Brain } from 'lucide-react';
import axios from 'axios';
import DeveloperProfileView from '../components/DeveloperProfileView';
import ProjectManagerDashboard from './ProjectManagerDashboard';
import AuthPanel from '../components/AuthPanel';
import { getAuthToken, getCurrentUser } from '../utils/userContext';
import ErrorBoundary from '../components/ErrorBoundary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ExpertiseRecommendationHomePage = ({ module }) => {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'dashboard', 'issues'
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

    // Neural Handshake & Validation
    if (!currentUser?.email) {
      setError('AUTHENTICATION_FAILED: Please establish a secure personnel link before initiating operations.');
      return;
    }

    const sanitizedTitle = title.trim();
    const sanitizedDesc = description.trim();

    if (sanitizedTitle.length < 5) {
      setError('SIGNAL_ERROR: issue identifier too brief. Provide at least 5 characters.');
      return;
    }

    if (sanitizedDesc.length < 15) {
      setError('DATA_INSUFFICIENT: Description requires more telemetry (min 15 chars) for accurate category prediction.');
      return;
    }

    try {
      setLoading(true);
      const issueRes = await axios.post(`${API_BASE_URL}/api/expertise/issues`, {
        title: sanitizedTitle,
        description: sanitizedDesc,
        submittedBy: currentUser.email,
        submittedByName: currentUser.name,
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
      setError(err.response?.data?.detail || 'Failed to Assign Issue. Please try again.');
    } finally {
      setAssigningIssue({ ...assigningIssue, [developerEmail]: false });
    }
  };

  const isManager = currentUser?.role === 'manager';

  const handleNotificationClick = (issueId) => {
    console.log('DEBUG [Home]: Notification event received for:', issueId);
    setViewingIssueId(issueId);
  };

  const isAnyModalOpen = !!viewingIssueId || !!selectedDeveloper || !!submitterEmailForProfile;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isAnyModalOpen]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-brand-light font-sans antialiased">
      {/* SaaS Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-soft transition-transform duration-500 group-hover:scale-105">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Expertise <span className="text-brand">Sync</span></h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{systemConfig.organization || 'AgileSense AI'}</p>
            </div>
          </div>

          <AuthPanel
            onAuthChanged={(u) => setCurrentUser(u)}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 mb-10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2.5 px-2 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'submit'
              ? 'text-brand'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <FileText size={16} />
            Raise Issue
            {activeTab === 'submit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
          </button>
          {currentUser && !isManager && (
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-2.5 px-2 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'issues'
                ? 'text-brand'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <User size={16} />
              My Profile
              {activeTab === 'issues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
            </button>
          )}
          {isManager && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-2 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'dashboard'
                ? 'text-brand'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <LayoutDashboard size={16} />
              PM Dashboard
              {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
            </button>
          )}
        </div>

        {activeTab === 'dashboard' ? (
          <ProjectManagerDashboard refreshTrigger={refreshTrigger} />
        ) : activeTab === 'issues' ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <DeveloperProfileView
              developerEmail={currentUser?.email}
              isSubmitter={false}
              isModal={false}
              onClose={() => setActiveTab('submit')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Submit Form */}
            <div className="lg:col-span-12 xl:col-span-5">
              <div className="bg-white rounded-4xl shadow-soft border border-slate-100 p-10 sticky top-32 group transition-all duration-500">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Report Issue</h2>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Identify the optimal deployment expert</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Issue Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-slate-300"
                      placeholder="e.g., Critical latency in payment gateway"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Priority Level</label>
                      <div className="grid grid-cols-4 gap-3">
                        {['low', 'medium', 'high', 'critical'].map((p) => {
                          const isActive = priority === p;
                          const styles = {
                            low: { active: 'bg-emerald-50 border-emerald-200 text-emerald-700', hover: 'hover:text-emerald-600 hover:border-emerald-100' },
                            medium: { active: 'bg-amber-50 border-amber-200 text-amber-700', hover: 'hover:text-amber-600 hover:border-amber-100' },
                            high: { active: 'bg-rose-50 border-rose-200 text-rose-700', hover: 'hover:text-rose-600 hover:border-rose-100' },
                            critical: { active: 'bg-slate-900 border-slate-900 text-white shadow-lg', hover: 'hover:text-slate-900 hover:border-slate-300' }
                          };
                          
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                isActive 
                                  ? `${styles[p].active} scale-[1.02]`
                                  : `bg-white border-slate-100 text-slate-400 ${styles[p].hover}`
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Detailed Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-slate-200 bg-white px-6 py-6 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                      placeholder="Explain the technical nuances of the problem..."
                    />
                  </div>

                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-xs font-black flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      </div>
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-5 rounded-2xl text-xs font-black flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      </div>
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 bg-slate-900 hover:bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-premium active:scale-[0.98] disabled:opacity-50 group"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Brain size={18} className="group-hover:scale-110 transition-transform" />
                    )}
                    Submit Issue
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Results Section */}
            <div className="lg:col-span-12 xl:col-span-7">
              {!predictedCategory && !loading && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-5xl border border-slate-100 p-12 text-center group transition-all duration-700 shadow-soft">
                  <div className="w-64 h-64 mb-10 opacity-80 group-hover:opacity-100 transition-opacity">
                    <img 
                      src="./ai_analysis_illustration_1777707365726.png" 
                      alt="AI Analysis" 
                      className="w-full h-full object-contain animate-float"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Awaiting System Input</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed uppercase tracking-widest">
                    Provide the issue context to trigger the AI expertise mapping engine.
                  </p>
                </div>
              )}

              {loading && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200/60 p-12 text-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20 animate-pulse" />
                  <div className="relative z-10">
                    <div className="w-32 h-32 bg-blue-600/10 rounded-[3rem] flex items-center justify-center text-blue-600 mb-8 mx-auto animate-bounce border border-blue-100">
                      <Brain size={60} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">Mapping Intelligence...</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">Scanning developer expertise matrix</p>
                  </div>
                </div>
              )}

              {predictedCategory && !loading && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                  {/* Category Card */}
                  <div className="bg-slate-900 rounded-5xl p-10 text-white shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full -mr-48 -mt-48 blur-3xl" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                          AI Predicted Classification
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none">
                          {predictedCategory}
                        </h3>
                      </div>
                      {currentUser?.email && (
                        <button
                          onClick={() => setSubmitterEmailForProfile(currentUser.email)}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md active:scale-95 flex items-center gap-3"
                        >
                          <User size={14} className="text-brand" />
                          My Profile
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recommendation List */}
                  <div>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                      <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <Users size={18} className="text-brand" />
                        Expert Recommendations
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-success-dark bg-success-light px-3 py-1.5 rounded-lg border border-success/10 uppercase tracking-widest">
                          Matches: {recommendations.length}
                        </span>
                      </div>
                    </div>

                    {recommendations.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">Insufficient expert data for this category</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recommendations.map((dev, idx) => {
                          const expertiseScore = dev.expertiseScore !== undefined
                            ? dev.expertiseScore
                            : (dev.expertise?.[predictedCategory] ?? 0);

                          const pendingCount = dev.pending_count || 0;
                          const isOverloaded = pendingCount > 5;
                          const isPreference = dev.recommendation_reason === 'preference';

                          const getAvatarColor = (name) => {
                            const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];
                            const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            return colors[hash % colors.length];
                          };

                          return (
                            <div
                              key={dev.email}
                              className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft hover:shadow-premium hover:-translate-y-2 transition-all duration-500 group flex flex-col relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
                              
                              <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className={`w-14 h-14 ${getAvatarColor(dev.name)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/10 group-hover:scale-110 transition-transform duration-500`}>
                                  {dev.name.charAt(0)}
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank #{idx + 1}</p>
                                  <p className={`text-2xl font-black tracking-tighter ${expertiseScore > 0.8 ? 'text-success' : 'text-brand'}`}>
                                    {Math.round(expertiseScore * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1 mb-8 relative z-10">
                                <h4 className="font-bold text-slate-900 text-lg group-hover:text-brand transition-colors leading-tight truncate">{dev.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate">{dev.email}</p>

                                <div className="mt-8 flex flex-wrap gap-2">
                                  {isPreference && (
                                    <span className="bg-indigo-50 text-brand text-[8px] font-black px-2.5 py-1.5 rounded-lg border border-brand/10 uppercase tracking-widest">
                                      Intent Match
                                    </span>
                                  )}
                                  {isOverloaded ? (
                                    <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2.5 py-1.5 rounded-lg border border-amber-100 uppercase tracking-widest">
                                      High Load
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-50 text-success text-[8px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
                                      Available
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-8 border-t border-slate-50 relative z-10">
                                {isManager ? (
                                  <button
                                    onClick={() => handleAssignIssue(dev.email, dev.name)}
                                    disabled={assigningIssue[dev.email] || isOverloaded}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg border-b-2 border-black/10 ${isOverloaded || assigningIssue[dev.email]
                                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                      : 'bg-brand text-white hover:bg-indigo-700 active:bg-purple-700 active:scale-95 shadow-brand/20'
                                      }`}
                                  >
                                    {assigningIssue[dev.email] ? 'Processing...' : 'Assign Individual'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedDeveloper(dev.email)}
                                    className="w-full py-4 bg-slate-50 hover:bg-brand/5 text-slate-400 hover:text-brand rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-transparent hover:border-brand/10"
                                  >
                                    Inspect Expertise
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
 * Modern Issues Briefing Modal for deep-linked notifications
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
      alert('Issue Accepted! Status is now In Progress.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept issue.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!issueId) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3.5rem] shadow-premium max-w-6xl w-full max-h-[94vh] overflow-hidden border border-white/20 flex flex-col relative animate-in zoom-in-95 duration-500">
        
        {/* Colourful Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-purple-500 to-rose-500 z-50" />

        {/* Header Section */}
        <div className="px-12 pt-12 pb-8 shrink-0 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-brand">Active Mission</span>
              <X size={12} className="rotate-45" />
              <span>Issue #{String(issueId).split('-').pop()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
          
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
            {issue?.title || 'Loading Context...'}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Deployment Hub: Issue Briefing
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar relative z-10">
          {loading ? (
            <div className="bg-slate-50/50 rounded-[2.5rem] p-20 flex flex-col items-center justify-center border border-slate-100 min-h-[400px]">
              <div className="w-12 h-12 border-4 border-brand/10 border-t-brand rounded-full animate-spin mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Data Terminal...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50/50 rounded-[2.5rem] p-20 text-center border border-rose-100 min-h-[400px] flex flex-col items-center justify-center">
              <AlertTriangle className="w-16 h-16 text-rose-500 mb-6 opacity-20" />
              <p className="text-sm font-bold text-rose-600 mb-8 max-w-sm mx-auto">{error}</p>
              <button onClick={onClose} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all">Close Portal</button>
            </div>
          ) : issue ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Context & Metadata */}
              <div className="lg:col-span-7 space-y-10">
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-soft relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                  
                  <div className="space-y-6 relative z-10 mb-12">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-brand rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Description</h4>
                    </div>
                    <p className="text-slate-800 text-lg leading-relaxed font-semibold">
                      {issue.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-10 relative z-10 pt-10 border-t border-slate-50">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Core Category:</h4>
                      <div className="inline-flex px-8 py-3 bg-indigo-50 text-brand border border-brand/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                        {issue.category}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Workflow State:</h4>
                      <div className={`inline-flex px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                        issue.status === 'resolved' ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {issue.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-soft flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:border-brand transition-colors">
                      <User size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Assigned Expert</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{issue.assignedToName || 'Awaiting Sync'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported On</p>
                    <p className="text-sm font-bold text-slate-900">{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Resolution Actions */}
              <div className="lg:col-span-5 h-full">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-premium h-full flex flex-col min-h-[500px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  
                  <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-1.5 h-6 bg-brand rounded-full shadow-[0_0_15px_rgba(79,70,229,0.6)]" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Resolution Terminal</h3>
                  </div>

                  {issue.status !== 'resolved' ? (
                    <div className="flex-1 flex flex-col relative z-10">
                      <div className="mb-8 flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Action Debrief & Fix Summary</label>
                        <textarea
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Describe the technical resolution..."
                          className="w-full h-full min-h-[250px] p-8 rounded-[2rem] bg-white/5 border border-white/10 text-white text-base font-medium focus:bg-white/[0.08] focus:border-brand outline-none transition-all resize-none leading-relaxed placeholder:text-slate-700"
                        />
                      </div>
                      <div className="space-y-4">
                        {issue.status === 'assigned' && (
                          <button
                            onClick={handleAcceptMission}
                            disabled={isAccepting}
                            className="w-full py-5 bg-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-20 shadow-lg shadow-brand/20"
                          >
                            {isAccepting ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Accept Issue <ArrowRight size={18} /></>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsFixed('resolved')}
                          disabled={isResolving || issue.status === 'assigned'}
                          className={`w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg border-b-4 border-black/10 ${issue.status === 'assigned' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}
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
                          className="w-full py-4 text-slate-500 hover:text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 active:scale-[0.98]"
                        >
                          Mark as Blocked
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                      <div className="w-24 h-24 bg-success/10 rounded-[2.5rem] flex items-center justify-center text-success mb-10 border border-success/20 shadow-2xl shadow-success/10">
                        <CheckCircle size={48} />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-4">Issue Resolved</h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-[200px]">The expertise matrix has been successfully updated.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};

export default ExpertiseRecommendationHomePage;