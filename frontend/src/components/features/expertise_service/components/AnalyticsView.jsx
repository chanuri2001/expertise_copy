import React from 'react';
import { Radar as RadarIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, AlertTriangle } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

const AnalyticsView = ({ analytics, analyticsError }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Team Expertise Radar */}
        <div className="bg-white rounded-4xl border border-slate-100 p-10 shadow-soft flex flex-col min-h-[500px] transition-all group">
          <div className="flex items-center gap-5 mb-10 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-indigo-50 text-brand rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <RadarIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase">Expertise Distribution</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Team Competency Matrix</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            {analyticsError ? (
              <div className="text-center p-8 bg-rose-50/50 rounded-2xl border border-rose-100">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                <p className="text-xs text-rose-700 font-bold uppercase tracking-widest">{analyticsError}</p>
              </div>
            ) : analytics?.teamExpertiseMatrix ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.teamExpertiseMatrix}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                  <Radar
                    name="Team Average"
                    dataKey="A"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="#4F46E5"
                    fillOpacity={0.1}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '0.75rem' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-slate-100 border-t-brand rounded-full animate-spin" />
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest animate-pulse">Syncing Matrix...</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution Pie */}
        <div className="bg-white rounded-4xl border border-slate-100 p-10 shadow-soft flex flex-col min-h-[500px] transition-all group">
          <div className="flex items-center gap-5 mb-10 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-emerald-50 text-success rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase">Sector Allocation</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Issue Volume Dispersion</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            {analytics?.categoryDistribution ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '0.75rem' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-slate-100 border-t-success rounded-full animate-spin" />
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest animate-pulse">Calculating Density...</p>
              </div>
            )}
          </div>
        </div>

        {/* Resolution Velocity Bar */}
        <div className="bg-slate-900 rounded-5xl border border-slate-800 p-12 shadow-premium flex flex-col lg:col-span-2 min-h-[500px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-brand/10 rounded-full blur-[100px] -mr-60 -mt-60 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5 relative z-10">
            <div className="w-14 h-14 bg-white/5 text-brand rounded-2xl flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110">
              <BarChartIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Resolution Velocity</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-2">Deployment Throughput Trace</p>
            </div>
          </div>
          
          <div className="flex-1 relative z-10">
            {analytics?.resolutionVelocity ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analytics.resolutionVelocity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '1rem', border: '1px solid #1E293B', padding: '1rem' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#10B981' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#colorVelocity)"
                    radius={[8, 8, 2, 2]}
                    barSize={40}
                  />
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-white/5 border-t-brand rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Velocity...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
