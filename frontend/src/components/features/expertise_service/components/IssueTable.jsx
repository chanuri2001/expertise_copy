import React from 'react';
import { 
  Filter, AlertTriangle, LayoutDashboard, Clock, 
  UserCheck, CheckCircle, AlertCircle, Eye, Edit2, 
  Trash2, ChevronLeft, ChevronRight, User
} from 'lucide-react';

const getStatusStyles = (status) => {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-warning border-warning/20 shadow-warning/5';
    case 'assigned': return 'bg-indigo-50 text-brand border-brand/20 shadow-brand/5';
    case 'in_progress': return 'bg-indigo-100 text-brand border-brand/30 shadow-brand/10';
    case 'done': return 'bg-emerald-50 text-success border-success/20 shadow-success/5';
    case 'resolved': return 'bg-emerald-50 text-success border-success/20 shadow-success/5';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

const getAvatarColor = (name) => {
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 
    'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 
    'bg-cyan-500', 'bg-teal-500', 'bg-orange-500'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({ name, email, size = "sm" }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
  const sizeClasses = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  const colorClass = getAvatarColor(name);
  
  return (
    <div className={`${sizeClasses} rounded-full ${colorClass} flex items-center justify-center font-bold text-white overflow-hidden shrink-0 shadow-sm border border-white/20`}>
      {initials}
    </div>
  );
};

const IssueTable = ({
  loading,
  error,
  issues,
  page,
  setPage,
  limit,
  totalIssues,
  statusFilter,
  setStatusFilter,
  setSelectedIssue,
  setEditingIssue,
  handleDeleteIssue,
  setSelectedDeveloper
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'all', label: 'All Operations', icon: LayoutDashboard, color: 'slate' },
            { id: 'pending', label: 'Pending Sync', icon: Clock, color: 'warning' },
            { id: 'assigned', label: 'In Progress', icon: UserCheck, color: 'indigo' },
            { id: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'success' }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => {
                setStatusFilter(status.id);
                setPage(1);
              }}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border-2 ${statusFilter === status.id
                ? status.id === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' :
                  status.id === 'pending' ? 'bg-amber-400 border-amber-400 text-slate-900 shadow-lg shadow-amber-200' :
                  status.id === 'assigned' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' :
                  'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600 shadow-sm'
                }`}
            >
              <status.icon size={14} className={statusFilter === status.id ? (status.id === 'pending' ? 'text-slate-900' : 'text-white') : ''} />
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Pipeline...</p>
          </div>
        ) : error ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{error}</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center px-6">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
              <LayoutDashboard size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Pipeline Clear</h3>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">No active units in this sector.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pl-8 pr-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Expert</th>
                  <th className="pl-4 pr-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {issues.map((issue) => (
                  <tr key={issue.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="pl-8 pr-4 py-6">
                      <div className="max-w-[240px]">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand transition-colors">{issue.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">{issue.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-brand text-[9px] font-bold uppercase tracking-widest border border-brand/5">
                        {issue.category}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={issue.submittedByName} email={issue.submittedBy} />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 leading-none">{issue.submittedByName || 'User'}</span>
                          <span className="text-[9px] text-slate-400 mt-1">{issue.submittedBy?.split('@')[0]}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(issue.status)} shadow-sm`}>
                        {issue.status === 'pending' && <Clock size={12} />}
                        {issue.status === 'assigned' && <UserCheck size={12} />}
                        {issue.status === 'in_progress' && <TrendingUp size={12} />}
                        {issue.status === 'resolved' && <CheckCircle size={12} />}
                        {issue.status === 'done' && <CheckCircle size={12} />}
                        {issue.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      {issue.assignedToName ? (
                        <div className="flex items-center gap-3">
                          <Avatar name={issue.assignedToName} email={issue.assignedTo} />
                            <div className="flex flex-col gap-1 w-full min-w-[100px]">
                              <button
                                onClick={() => setSelectedDeveloper(issue.assignedTo)}
                                className="text-[11px] font-bold text-slate-900 hover:text-brand transition-colors text-left leading-none"
                              >
                                {issue.assignedToName}
                              </button>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px] ${
                                      issue.assignedToCapacity < 30 ? 'bg-rose-500 shadow-rose-500/40' : 
                                      issue.assignedToCapacity < 70 ? 'bg-amber-500 shadow-amber-500/40' : 
                                      'bg-emerald-500 shadow-emerald-500/40'
                                    }`}
                                    style={{ width: `${issue.assignedToCapacity || 0}%` }}
                                  />
                                </div>
                                <span className={`text-[8px] font-bold ${
                                  issue.assignedToCapacity < 30 ? 'text-rose-600' : 
                                  issue.assignedToCapacity < 70 ? 'text-amber-600' : 
                                  'text-emerald-600'
                                }`}>
                                  {issue.assignedToCapacity || 0}%
                                </span>
                              </div>
                            </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="pl-4 pr-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingIssue(issue)}
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
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
        )}

        {/* Pagination */}
        {issues.length > 0 && (
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {Math.max(1, Math.ceil(totalIssues / limit))}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-slate-400 hover:text-brand disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalIssues / limit)}
                className="p-2 text-slate-400 hover:text-brand disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueTable;
