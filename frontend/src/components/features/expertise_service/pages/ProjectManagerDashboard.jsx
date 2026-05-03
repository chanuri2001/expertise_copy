import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  UserCheck,
  Filter,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Save,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Radar as RadarIcon
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import axios from 'axios';
import DeveloperProfileView from '../components/DeveloperProfileView';
import IssueTable from '../components/IssueTable';
import AnalyticsView from '../components/AnalyticsView';
import IssueDetailModal from '../components/IssueDetailModal';
import { getAuthToken } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

const ProjectManagerDashboard = ({ refreshTrigger }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigning, setAssigning] = useState({});
  const [systemConfig, setSystemConfig] = useState({ categories: [], organization: 'AgileSense AI' });

  // Pagination & Management State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalIssues, setTotalIssues] = useState(0);
  const [isDeleting, setIsDeleting] = useState(null); // id of issue being deleted
  const [editingIssue, setEditingIssue] = useState(null); // issue object being edited
  const [activeTab, setActiveTab] = useState('issues');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchConfig();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsError(null);
      const response = await axios.get(`${API_BASE_URL}/api/expertise/analytics`, {
        headers: authHeaders()
      });
      setAnalytics(response.data);
    } catch (err) {
      setAnalyticsError(err.response?.data?.detail || 'Failed to sync expertise matrix');
    }
  };

  const fetchConfig = async () => {
    try {
      console.log('DEBUG: Fetching config from', `${API_BASE_URL}/api/expertise/config`);
      const res = await axios.get(`${API_BASE_URL}/api/expertise/config`);
      console.log('DEBUG: Config received', res.data);
      setSystemConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    // Refresh every 60 seconds to reduce log flood
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchIssues();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [statusFilter, page, refreshTrigger]);

  useEffect(() => {
    if (selectedIssue || selectedDeveloper || editingIssue) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedIssue, selectedDeveloper, editingIssue]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('DEBUG: Fetching issues from', `${API_BASE_URL}/api/expertise/issues`, { page, limit, statusFilter });

      const params = {
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      const response = await axios.get(`${API_BASE_URL}/api/expertise/issues`, {
        params,
        headers: authHeaders()
      });

      console.log('DEBUG: Issues received', response.data);
      setIssues(response.data.issues || []);
      setTotalIssues(response.data.total || 0);
    } catch (err) {
      console.error('DEBUG: Fetch issues ERROR', err);
      setError(err.response?.data?.detail || 'Failed to load issues. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this issue? This cannot be undone.')) return;
    try {
      setIsDeleting(issueId);
      await axios.delete(`${API_BASE_URL}/api/expertise/issues/${issueId}`, { headers: authHeaders() });
      await fetchIssues();
      alert('Issue deleted successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete issue');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await axios.put(`${API_BASE_URL}/api/expertise/issues/${editingIssue.id}`, editingIssue, { headers: authHeaders() });
      await fetchIssues();
      setEditingIssue(null);
      alert('Issue updated successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update issue');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignIssue = async (issue, developerEmail, developerName) => {
    try {
      setAssigning({ ...assigning, [issue.id]: true });
      await axios.post(`${API_BASE_URL}/api/expertise/issues/assign`, {
        issueId: issue.id,
        developerEmail,
        developerName,
      }, { headers: authHeaders() });

      await fetchIssues();
      setSelectedIssue(null);
    } catch (err) {
      console.error('Failed to Assign Issue', err);
    } finally {
      setAssigning({ ...assigning, [issue.id]: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'resolved':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'assigned':
      case 'in_progress':
        return <UserCheck className="w-4 h-4" />;
      case 'done':
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };


  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    assigned: issues.filter(i => i.status === 'assigned' || i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved' || i.status === 'done').length,
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Command <span className="text-brand">Center</span></h1>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Operational Oversight & Expert Deployment</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'issues'
              ? 'text-brand'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Pipeline
            {activeTab === 'issues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
          </button>
          <button
            onClick={() => {
              setActiveTab('analytics');
              fetchAnalytics();
            }}
            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'analytics'
              ? 'text-brand'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Analytics
            {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume', value: stats.total, icon: LayoutDashboard, color: 'brand', bg: 'bg-indigo-50/50' },
          { label: 'Pending Sync', value: stats.pending, icon: Clock, color: 'warning', bg: 'bg-amber-50/50' },
          { label: 'Deployed Units', value: stats.assigned, icon: UserCheck, color: 'brand', bg: 'bg-indigo-50/50' },
          { label: 'Verified Success', value: stats.resolved, icon: CheckCircle, color: 'success', bg: 'bg-emerald-50/50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-4xl border border-slate-100 p-8 shadow-soft transition-all duration-500 group hover:shadow-premium hover:-translate-y-1 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-12 -mt-12 transition-opacity group-hover:opacity-100`} />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 text-${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={20} />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-4xl font-bold text-slate-900 tracking-tighter">{stat.value}</p>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg bg-${stat.color}/5 text-${stat.color} border border-${stat.color}/10 uppercase tracking-widest`}>
                Active
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'issues' ? (
        <IssueTable
          loading={loading}
          error={error}
          issues={issues}
          page={page}
          setPage={setPage}
          limit={limit}
          totalIssues={totalIssues}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setSelectedIssue={setSelectedIssue}
          setEditingIssue={setEditingIssue}
          handleDeleteIssue={handleDeleteIssue}
          setSelectedDeveloper={setSelectedDeveloper}
        />
      ) : (
        <AnalyticsView analytics={analytics} analyticsError={analyticsError} />
      )}


      {/* Modals */}
      <IssueDetailModal 
        selectedIssue={selectedIssue}
        setSelectedIssue={setSelectedIssue}
        setSelectedDeveloper={setSelectedDeveloper}
        handleAssignIssue={handleAssignIssue}
        assigning={assigning}
      />

      {/* Update Issue Modal */}
      {editingIssue && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <Edit2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Update Issue</h2>
                  <p className="text-xs text-slate-500 font-medium">Updating details for {editingIssue.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIssue(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateIssue} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    value={editingIssue.title}
                    onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Issue Description</label>
                  <textarea
                    required
                    rows={4}
                    value={editingIssue.description}
                    onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Priority Level</label>
                    <select
                      value={editingIssue.priority}
                      onChange={(e) => setEditingIssue({ ...editingIssue, priority: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                      <option value="critical">CRITICAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Status Code</label>
                    <select
                      value={editingIssue.status}
                      onChange={(e) => setEditingIssue({ ...editingIssue, status: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                    >
                      <option value="pending">PENDING</option>
                      <option value="assigned">ASSIGNED</option>
                      <option value="in_progress">IN_PROGRESS</option>
                      <option value="done">SYSTEM_DONE</option>
                      <option value="resolved">RESOLVED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? 'SAVING...' : (
                    <>
                      <Save className="w-4 h-4" />
                      SAVE_CHANGES
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('portal-root') || document.body
      )}

      {/* Developer Profile Modal */}
      {
        selectedDeveloper && (
          <DeveloperProfileView
            developerEmail={selectedDeveloper}
            onClose={() => setSelectedDeveloper(null)}
          />
        )
      }
    </div >
  );
};

export default ProjectManagerDashboard;
