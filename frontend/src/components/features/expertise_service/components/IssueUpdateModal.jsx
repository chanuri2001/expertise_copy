import React from 'react';
import { Edit2, X, Save } from 'lucide-react';

const IssueUpdateModal = ({ editingIssue, setEditingIssue, handleUpdateIssue, isUpdating }) => {
  if (!editingIssue) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-5xl shadow-premium max-w-2xl w-full border border-slate-100 overflow-hidden relative">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -mr-32 -mt-32" />

        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-brand shadow-soft">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Update Intelligence</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Refining Metadata for #{editingIssue.id.split('-').pop()}</p>
            </div>
          </div>
          <button
            onClick={() => setEditingIssue(null)}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdateIssue} className="p-10 space-y-8 relative z-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Incident Title</label>
              <input
                type="text"
                required
                value={editingIssue.title}
                onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium text-slate-900"
                placeholder="Enter title..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Technical Description</label>
              <textarea
                required
                rows={4}
                value={editingIssue.description}
                onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium text-slate-900 resize-none"
                placeholder="Detailed context..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Priority Vector</label>
                <select
                  value={editingIssue.priority}
                  onChange={(e) => setEditingIssue({ ...editingIssue, priority: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="critical">CRITICAL</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Operational State</label>
                <select
                  value={editingIssue.status}
                  onChange={(e) => setEditingIssue({ ...editingIssue, status: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  <option value="pending">PENDING</option>
                  <option value="assigned">ASSIGNED</option>
                  <option value="in_progress">IN_PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setEditingIssue(null)}
              className="flex-1 px-8 py-4 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand transition-all shadow-premium disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Confirm Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueUpdateModal;
