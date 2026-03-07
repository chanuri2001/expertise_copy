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
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import DeveloperProfileView from '../components/DeveloperProfileView';
import { getAuthToken } from '../utils/userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const [isUpdating, setIsUpdating] = useState(false);

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchConfig();
  }, []);

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
    // Refresh every 30 seconds
    const interval = setInterval(fetchIssues, 30000);
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
    if (!window.confirm('Are you absolutely sure you want to delete this mission? This cannot be undone.')) return;
    try {
      setIsDeleting(issueId);
      await axios.delete(`${API_BASE_URL}/api/expertise/issues/${issueId}`, { headers: authHeaders() });
      await fetchIssues();
      alert('Mission deleted successfully');
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
      alert('Mission updated successfully');
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
      alert(err.response?.data?.detail || 'Failed to Assign Mission');
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <LayoutDashboard className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-black text-black">Project Manager Dashboard</h1>
          <p className="text-xs text-gray-600">Manage and Assign Missions to experts</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            </div>
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-black text-blue-600">{stats.assigned}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-black text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset to first page on filter change
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Issues</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading Issues...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <LayoutDashboard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No issues found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{issue.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{issue.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                        {issue.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">{issue.submittedByName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{issue.submittedBy}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          {issue.status}
                        </span>
                        {issue.status === 'resolved' && issue.resolutionNote && (
                          <div className="text-[10px] text-gray-500 italic max-w-[150px] truncate" title={issue.resolutionNote}>
                            Note: {issue.resolutionNote}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {issue.assignedToName ? (
                        <div>
                          <p className="font-medium">{issue.assignedToName}</p>
                          <p className="text-xs text-gray-500">{issue.assignedTo}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => setEditingIssue(issue)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(issue.id)}
                          disabled={isDeleting === issue.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {isDeleting === issue.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={issues.length < limit}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 uppercase tracking-widest font-black text-[10px]">
                  Showing <span className="font-bold text-blue-600">{(page - 1) * limit + 1}</span> to <span className="font-bold text-blue-600">{Math.min(page * limit, totalIssues)}</span> of <span className="font-bold text-blue-600">{totalIssues}</span> missions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {[...Array(Math.ceil(totalIssues / limit))].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-black ${page === i + 1
                        ? 'z-10 bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  )).slice(Math.max(0, page - 3), Math.min(Math.ceil(totalIssues / limit), page + 2))}

                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalIssues / limit)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
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
                {/* Deep immersive background for header */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 -z-10" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48" />

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl shadow-black/40">
                      <LayoutDashboard className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase text-blue-300 tracking-[0.2em] shadow-inner shadow-blue-400/10">
                          Mission Detail
                        </span>
                        <span className="text-white/30 text-[10px] font-mono letter-spacing-widest">OPS_ID: {selectedIssue.id.split('-').pop()}</span>
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                        {selectedIssue.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIssue(null);
                      setSelectedDeveloper(null);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all hover:rotate-90 duration-300 backdrop-blur-md shadow-xl"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-10 pb-10 -mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                  {/* Main Details */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 relative group/card overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover/card:bg-blue-500 transition-colors duration-500" />

                      <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-6 h-0.5 bg-blue-500/30" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Objective Description</h4>
                        </div>
                        <p className="text-slate-800 text-xl leading-relaxed font-semibold tracking-tight">
                          {selectedIssue.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                        <div className="space-y-6">
                          <div className="group">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 group-hover:text-blue-600 transition-colors">Core Category</h4>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shadow-sm">
                              <div className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                              <span className="text-xs font-black uppercase tracking-widest">{selectedIssue.category}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Workflow State</h4>
                            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border shadow-sm ${getStatusColor(selectedIssue.status)}`}>
                              {getStatusIcon(selectedIssue.status)}
                              <span className="text-xs font-black uppercase tracking-widest">{selectedIssue.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Intelligence Source</h4>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                {selectedIssue.submittedByName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">{selectedIssue.submittedByName || 'User'}</p>
                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{selectedIssue.submittedBy}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Timestamp</h4>
                            <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                              <Clock className="w-4 h-4 opacity-30" />
                              <p className="text-[11px] font-bold tracking-tight">
                                {selectedIssue.createdAt && !isNaN(new Date(selectedIssue.createdAt)) ? new Date(selectedIssue.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Overlay if assigned */}
                    {selectedIssue.assignedTo && (
                      <div className={`rounded-[2.5rem] p-10 border-2 shadow-2xl relative overflow-hidden transition-all duration-700 ${selectedIssue.status === 'resolved'
                        ? 'bg-emerald-950 border-emerald-400/30 text-emerald-50'
                        : 'bg-slate-900 border-blue-400/30 text-white shadow-blue-900/40'
                        }`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <UserCheck className="w-40 h-40" />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-3xl ${selectedIssue.status === 'resolved' ? 'bg-emerald-500/20' : 'bg-blue-500/20 shadow-inner'}`}>
                              <UserCheck className={`w-8 h-8 ${selectedIssue.status === 'resolved' ? 'text-emerald-400' : 'text-blue-400'}`} />
                            </div>
                            <div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1 leading-none">
                                {selectedIssue.status === 'resolved' ? 'OPERATIONAL SUCCESS' : 'ACTIVE OPERATOR'}
                              </h3>
                              <p className="text-4xl font-black tracking-tighter leading-none mt-3">
                                {selectedIssue.assignedToName}
                              </p>
                              <div className="flex items-center gap-2 mt-4 opacity-40">
                                <span className="w-1 h-3 bg-current" />
                                <p className="text-[11px] font-mono tracking-widest uppercase">{selectedIssue.assignedTo}</p>
                              </div>
                            </div>
                          </div>
                          {selectedIssue.status === 'resolved' && (
                            <div className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/50 animate-pulse">
                              MISSION_RESOLVED
                            </div>
                          )}
                        </div>

                        {selectedIssue.status === 'resolved' && selectedIssue.resolutionNote && (
                          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mt-6 relative group hover:bg-white/[0.08] transition-all duration-500">
                            <div className="absolute -top-3 left-8 px-4 py-1.5 bg-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-950/50">Post-Mission Intel</div>
                            <p className="text-lg font-medium leading-relaxed italic opacity-95 text-emerald-100/90 py-2">
                              "{selectedIssue.resolutionNote}"
                            </p>
                          </div>
                        )}

                        <div className="mt-10 flex flex-wrap gap-10 pt-8 border-t border-white/10 opacity-40 relative z-10">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">DEPLOY_INIT: {selectedIssue.assignedAt && !isNaN(new Date(selectedIssue.assignedAt)) ? new Date(selectedIssue.assignedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          {selectedIssue.resolvedAt && (
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">DEPLOY_DONE: {selectedIssue.resolvedAt && !isNaN(new Date(selectedIssue.resolvedAt)) ? new Date(selectedIssue.resolvedAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations Column */}
                  <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 h-full border border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group/recs flex flex-col min-h-[600px]">
                      {/* Background accent */}
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/recs:opacity-20 transition-opacity pointer-events-none">
                        <TrendingUp className="w-24 h-24 text-blue-400 rotate-12" />
                      </div>

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-1 bg-gradient-to-r from-blue-600 to-transparent rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
                          <h3 className="text-sm font-black text-white tracking-[0.3em] uppercase">STRATEGIC_RECS</h3>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                          {selectedIssue.topExperts?.map((expert, idx) => (
                            <div
                              key={expert.email}
                              className="bg-black/30 border border-white/5 rounded-[2.2rem] p-6 hover:bg-black/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 group/expert relative overflow-hidden active:scale-[0.98]"
                            >
                              {/* Expert highlight glow */}
                              <div className="absolute inset-0 bg-blue-500/0 group-hover/expert:bg-blue-500/[0.02] transition-colors" />

                              <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-white/5 group-hover/expert:bg-blue-600/20 rounded-[1.8rem] flex items-center justify-center border border-white/10 text-blue-400 font-black relative transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                                    <User className="w-8 h-8 group-hover/expert:scale-110 transition-transform" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white text-xs font-black flex items-center justify-center rounded-2xl shadow-xl">
                                      {idx + 1}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-white text-xl tracking-tighter mb-0.5">{expert.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{expert.email}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                <div className="bg-black/60 p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-center text-center group-hover/expert:border-blue-500/20 transition-colors">
                                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-[0.3em]">Authority</p>
                                  <p className="text-2xl font-black text-blue-400 tracking-tighter">{(expert.expertiseScore * 100).toFixed(0)}%</p>
                                </div>
                                <div className="bg-black/60 p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-center text-center group-hover/expert:border-white/10 transition-colors">
                                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-[0.3em]">Workload</p>
                                  <p className={`text-2xl font-black tracking-tighter ${expert.pending_count > 3 ? 'text-orange-500' : 'text-slate-300'}`}>
                                    {expert.pending_count || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-5 relative z-10">
                                <div className="flex items-center justify-between">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${expert.recommendation_reason === 'preference'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {expert.recommendation_reason === 'preference' ? 'INTENT_MATCH' : 'EXPERT_TRACK'}
                                  </span>
                                  <button
                                    onClick={() => setSelectedDeveloper(expert.email)}
                                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 group/intel"
                                  >
                                    VIEW_INTEL <Eye className="w-4 h-4 group-hover/intel:scale-110 transition-transform" />
                                  </button>
                                </div>

                                {selectedIssue.status === 'pending' && (
                                  <button
                                    onClick={() => handleAssignIssue(selectedIssue, expert.email, expert.name)}
                                    disabled={assigning[selectedIssue.id]}
                                    className="w-full py-4.5 bg-white text-slate-900 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-30 shadow-2xl shadow-white/5 active:bg-blue-100"
                                  >
                                    {assigning[selectedIssue.id] ? 'DEPL_SYCNING...' : 'CONFIRM_DEPLOYMENT'}
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

      {/* Update Mission Modal */}
      {editingIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <Edit2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Update Mission</h2>
                  <p className="text-xs text-slate-500 font-medium">Refining parameters for {editingIssue.id}</p>
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Mission Title</label>
                  <input
                    type="text"
                    required
                    value={editingIssue.title}
                    onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Intelligence Debrief (Description)</label>
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
                      <option value="low">LOW_PRIORITY</option>
                      <option value="medium">MEDIUM_PRIORITY</option>
                      <option value="high">HIGH_PRIORITY</option>
                      <option value="critical">CRITICAL_VITAL</option>
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
                  {isUpdating ? 'UPLINKING...' : (
                    <>
                      <Save className="w-4 h-4" />
                      COMMIT_CHANGES
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

