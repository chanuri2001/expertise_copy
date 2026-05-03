import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Shield, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const IssueDetailModal = ({ 
  selectedIssue, 
  setSelectedIssue, 
  setSelectedDeveloper, 
  handleAssignIssue, 
  assigning = {} 
}) => {
  if (!selectedIssue) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3.5rem] shadow-premium max-w-6xl w-full max-h-[94vh] overflow-hidden border border-white/20 flex flex-col relative animate-in zoom-in-95 duration-500">
        
        {/* Colourful Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-purple-500 to-rose-500 z-50" />
        <div className="px-12 pt-12 pb-8 shrink-0 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-brand">All Issues</span>
              <ChevronRight size={12} />
              <span>Issue #{selectedIssue.id.split('-').pop()}</span>
            </div>
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
          
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
            {selectedIssue.title}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Project ID: 25-26J-525
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Column: Metadata & Description */}
            <div className="lg:col-span-7 space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                
                <div className="grid grid-cols-2 gap-10 mb-12 relative z-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Core Category:</h4>
                    <div className="inline-flex px-8 py-3 bg-indigo-50 text-brand border border-brand/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                      {selectedIssue.category}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Workflow State:</h4>
                    <div className={`inline-flex px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      selectedIssue.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      selectedIssue.status === 'resolved' ? 'bg-emerald-50 text-success border-emerald-200' :
                      'bg-indigo-50 text-brand border-brand/10'
                    }`}>
                      {selectedIssue.status}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 relative z-10 mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-brand rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Description</h4>
                  </div>
                  <p className="text-slate-800 text-lg leading-relaxed font-semibold">
                    {selectedIssue.description || "The main dashboard grid view intermittently becomes completely unresponsive. This usually occurs after scrolling through a large number of entries or immediately after a table sort operation. Requires a page refresh to resolve."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-50 relative z-10">
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Submitted By:</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200">
                        {selectedIssue.submittedByName?.charAt(0) || 'E'}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{selectedIssue.submittedByName || "Elena Rostova"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp:</h4>
                    <p className="text-xs font-bold text-slate-900">5/3/2026</p>
                  </div>
                </div>
              </div>

              {/* Assignment Case */}
              {selectedIssue.assignedTo && (
                <div className={`rounded-[2.5rem] p-10 border-2 shadow-premium relative overflow-hidden transition-all duration-700 ${
                  selectedIssue.status === 'resolved' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                      <div className={`p-5 rounded-2xl ${selectedIssue.status === 'resolved' ? 'bg-success text-white' : 'bg-brand text-white shadow-lg shadow-brand/20'}`}>
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedIssue.status === 'resolved' ? 'text-success' : 'text-brand'}`}>
                          {selectedIssue.status === 'resolved' ? 'Operational Success' : 'Deployed Expert'}
                        </h3>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                          {selectedIssue.assignedToName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Expert Recommendations */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50/30 rounded-[2.5rem] p-8 border border-slate-100 h-full flex flex-col min-h-[600px] shadow-inner">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-1.5 h-6 bg-brand rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                  <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Expert Recommendations</h3>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                  {selectedIssue.topExperts?.map((expert, idx) => (
                    <div
                      key={expert.email}
                      className="bg-white border border-slate-100 rounded-[2rem] p-8 hover:shadow-premium hover:-translate-y-1 transition-all group relative active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:border-brand transition-colors">
                            <User size={28} className="text-slate-300 group-hover:text-brand transition-colors" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-brand text-white text-[9px] font-black flex items-center justify-center rounded-tl-xl shadow-lg border-2 border-white">
                              {idx + 1}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xl tracking-tight mb-1">{expert.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-3">{expert.email}</p>
                            <div className="flex items-center gap-4">
                              <button className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline">Expertise Track</button>
                              <button 
                                onClick={() => setSelectedDeveloper(expert.email)}
                                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                              >
                                View Profile 
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 mb-10">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Competence</span>
                            <span className="text-success">{(expert.expertiseScore * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${expert.expertiseScore * 100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Capacity</span>
                            <span className="text-success">{expert.capacity_percentage ?? '100'}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${expert.capacity_percentage ?? 100}%` }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Availability</span>
                          <span className="text-warning">{expert.workload_score?.toFixed(1) || '0.0'} (High)</span>
                        </div>
                      </div>

                      {selectedIssue.status === 'pending' && idx < 3 && (
                        <button
                          onClick={() => handleAssignIssue(selectedIssue, expert.email, expert.name)}
                          disabled={assigning[selectedIssue.id]}
                          className="w-full py-4 bg-brand hover:bg-indigo-700 active:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand/20 border-b-2 border-black/10"
                        >
                          {assigning[selectedIssue.id] ? 'Deploying...' : 'Assign Individual'}
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-brand transition-colors">View More Experts</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('portal-root') || document.body
  );
};

export default IssueDetailModal;
