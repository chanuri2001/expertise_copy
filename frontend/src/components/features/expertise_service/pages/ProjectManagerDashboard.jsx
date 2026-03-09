import React, { useState, useEffect } from 'react';
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

      // Refresh issues
      await fetchIssues();
      setSelectedIssue(null);
      alert(`Issue assigned to ${developerName} successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to Assign Issue');
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Manager Dashboard</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Operational Oversight & Expert Deployment</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Issues</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Awaiting Analysis</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Tasks</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.assigned}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resolved</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.resolved}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'issues'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <LayoutDashboard size={14} />
          Issues
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            fetchAnalytics();
          }}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'analytics'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <TrendingUp size={14} />
          Analytics
        </button>
      </div>

      {activeTab === 'issues' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400 px-2 border-r border-slate-100 mr-2">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Pipeline Filter</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-600 text-[11px] font-bold rounded-lg px-4 py-1.5 outline-none transition-all cursor-pointer uppercase tracking-tight"
            >
              <option value="all">ALL ACTIVE ISSUES</option>
              <option value="pending">PENDING</option>
              <option value="assigned">IN PROGRESS</option>
              <option value="resolved">RESOLVED</option>
            </select>
          </div>

          {/* Issues Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Expertise Data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-16 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-300">
                <LayoutDashboard className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Zero Active Issues</h3>
                <p className="text-sm font-medium text-slate-500 mt-2">The operational pipeline is currently clear.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Detail</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted By</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expert</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{issue.id.split('-').pop()}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="max-w-xs">
                            <p className="font-semibold text-slate-900 text-sm truncate">{issue.title}</p>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">{issue.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tight border border-blue-100">
                            {issue.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">{issue.submittedByName || 'User'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{issue.submittedBy}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight border ${getStatusColor(issue.status)}`}>
                              {getStatusIcon(issue.status)}
                              {issue.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {issue.assignedToName ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{issue.assignedToName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter border ${issue.assignedToCapacity < 30
                                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                                  : issue.assignedToCapacity < 60
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                  {issue.assignedToCapacity < 30 ? 'Overloaded' : 'Optimal'}
                                </span>
                              </div>
                              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-700 ${issue.assignedToCapacity < 30 ? 'bg-rose-500' : issue.assignedToCapacity < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${issue.assignedToCapacity}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting Assignment</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedIssue(issue)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditingIssue(issue)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteIssue(issue.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="bg-slate-50/50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Showing <span className="text-blue-600">{(page - 1) * limit + 1}</span> to <span className="text-blue-600">{Math.min(page * limit, totalIssues)}</span> of <span className="text-blue-600">{totalIssues}</span> issues
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.ceil(totalIssues / limit))].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${page === i + 1
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                          }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, page - 3), Math.min(Math.ceil(totalIssues / limit), page + 2))}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalIssues / limit)}
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Analytics View */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Team Expertise Radar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col min-h-[450px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <RadarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Team Expertise Matrix</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Cross-functional knowledge distribution</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {analyticsError ? (
                  <div className="text-center p-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-30" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{analyticsError}</p>
                  </div>
                ) : analytics?.teamExpertiseMatrix ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.teamExpertiseMatrix}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#cbd5e1', fontSize: 8 }} />
                      <Radar
                        name="Average Expertise"
                        dataKey="A"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-xs font-bold animate-pulse">Syncing data...</p>
                )}
              </div>
            </div>

            {/* Category Distribution Pie */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col min-h-[450px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <PieChartIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Issue Breakdown</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Volume by category over time</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {analytics?.categoryDistribution ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Legend
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-xs font-bold animate-pulse">Calculating Density...</p>
                )}
              </div>
            </div>

            {/* Resolution Velocity Bar */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:col-span-2 min-h-[450px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <BarChartIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase">Resolution Velocity</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Deployment Throughput (7-Day Trace)</p>
                </div>
              </div>
              <div className="flex-1">
                {analytics?.resolutionVelocity ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.resolutionVelocity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-xs font-bold animate-pulse">Syncing Velocity...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {
        selectedIssue && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] max-w-5xl w-full max-h-[92vh] overflow-hidden border border-white/40 flex flex-col relative">

              {/* Header / Command Center */}
              <div className="relative px-10 pt-10 pb-12 shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/20 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl">
                      <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-white/20 border border-white/30 rounded-full text-[10px] font-black uppercase text-white tracking-widest">
                          Issue Analysis
                        </span>
                        <span className="text-white/50 text-[10px] font-mono">ID: {selectedIssue.id.split('-').pop()}</span>
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                        {selectedIssue.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIssue(null);
                      setSelectedDeveloper(null);
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white transition-all duration-300 backdrop-blur-md"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-10 pb-10 -mt-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                  {/* Main Details */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-200 relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />

                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-6 h-0.5 bg-blue-600/30" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Description</h4>
                        </div>
                        <p className="text-slate-800 text-lg leading-relaxed font-semibold">
                          {selectedIssue.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Core Category</h4>
                          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-xs">
                            {selectedIssue.category}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Workflow State</h4>
                          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border font-bold text-xs uppercase ${getStatusColor(selectedIssue.status)}`}>
                            {selectedIssue.status}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Submitted By</h4>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                              {selectedIssue.submittedByName?.charAt(0) || 'U'}
                            </div>
                            <p className="text-xs font-bold text-slate-900">{selectedIssue.submittedByName}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Timestamp</h4>
                          <p className="text-xs font-bold text-slate-900">
                            {selectedIssue.createdAt && !isNaN(new Date(selectedIssue.createdAt)) ? new Date(selectedIssue.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Case */}
                    {selectedIssue.assignedTo && (
                      <div className={`rounded-[2rem] p-10 border-2 shadow-sm relative overflow-hidden transition-all duration-700 ${selectedIssue.status === 'resolved'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-950'
                        : 'bg-white border-blue-100/50 text-slate-900'
                        }`}>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-3xl ${selectedIssue.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                              <UserCheck className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 leading-none ${selectedIssue.status === 'resolved' ? 'text-emerald-600/60' : 'text-blue-600/60'}`}>
                                {selectedIssue.status === 'resolved' ? 'Operational success' : 'Active individual'}
                              </h3>
                              <p className="text-3xl font-black tracking-tighter mt-3">
                                {selectedIssue.assignedToName}
                              </p>
                            </div>
                          </div>
                          {selectedIssue.status === 'resolved' && (
                            <div className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              Resolved
                            </div>
                          )}
                        </div>

                        {selectedIssue.status === 'resolved' && selectedIssue.resolutionNote && (
                          <div className="bg-white/40 border border-emerald-200/50 rounded-2xl p-6 mt-6 relative">
                            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2">Resolution Note</div>
                            <p className="text-base font-medium leading-relaxed italic text-emerald-900/80">
                              "{selectedIssue.resolutionNote}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recommendations Column */}
                  <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="bg-white rounded-[2rem] p-8 h-full border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[600px]">

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                          <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Expert Recommendations</h3>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                          {selectedIssue.topExperts?.map((expert, idx) => (
                            <div
                              key={expert.email}
                              className="bg-slate-50 border border-slate-100 rounded-[1.8rem] p-6 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group/expert relative active:scale-[0.98]"
                            >
                              <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-blue-600 font-black relative transition-all group-hover:border-blue-400 group-hover:shadow-lg">
                                    <User className="w-7 h-7" />
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-xl shadow-lg border-2 border-white">
                                      {idx + 1}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-lg tracking-tight mb-0.5">{expert.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">{expert.email}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
                                  <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Auth</p>
                                  <p className="text-lg font-black text-blue-600 tracking-tighter">{(expert.expertiseScore * 100).toFixed(0)}%</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
                                  <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Cap</p>
                                  <p className={`text-lg font-black tracking-tighter ${(expert.capacity_percentage ?? 100) < 30 ? 'text-rose-500' : (expert.capacity_percentage ?? 100) < 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {expert.capacity_percentage ?? '100'}%
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
                                  <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Load</p>
                                  <p className="text-lg font-black text-slate-900 tracking-tighter">
                                    {expert.workload_score?.toFixed(1) || '0.0'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center justify-between">
                                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${expert.recommendation_reason === 'preference'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                    {expert.recommendation_reason === 'preference' ? 'Intent Match' : 'Expert Track'}
                                  </span>
                                  <button
                                    onClick={() => setSelectedDeveloper(expert.email)}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-700 transition-colors"
                                  >
                                    Profile <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {selectedIssue.status === 'pending' && (
                                  <button
                                    onClick={() => handleAssignIssue(selectedIssue, expert.email, expert.name)}
                                    disabled={assigning[selectedIssue.id]}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-blue-600/20"
                                  >
                                    {assigning[selectedIssue.id] ? 'Assigning...' : 'Assign Individual'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Update Issue Modal */}
      {editingIssue && (
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
        </div>
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

