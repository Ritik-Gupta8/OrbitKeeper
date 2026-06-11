import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, TrendingUp, MessageSquare, Trophy,
  XCircle, Clock, ChevronRight, Plus, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getDashboardStats } from '../lib/api.js';
import { formatDeadline, STATUS_CONFIG, getMatchColor } from '../lib/utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { PageLoader } from '../components/LoadingSpinner.jsx';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4ade80', '#f87171'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading dashboard..." />;

  const byStatus = stats?.byStatus || {};
  const pieData = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_CONFIG[k]?.label || k, value: v }));

  const barData = Object.entries(byStatus).map(([k, v]) => ({
    status: STATUS_CONFIG[k]?.label?.replace(' 🎉', '') || k,
    count: v,
  }));

  const statCards = [
    { label: 'Total',       value: stats?.total || 0,              icon: Briefcase,    color: 'text-indigo-400', bg: 'bg-indigo-600/10', ring: 'hover:shadow-indigo-500/20', glow: 'from-indigo-500/60' },
    { label: 'In Progress', value: byStatus.applied || 0,          icon: TrendingUp,   color: 'text-blue-400',   bg: 'bg-blue-600/10',   ring: 'hover:shadow-blue-500/20',   glow: 'from-blue-500/60' },
    { label: 'Interviews',  value: (byStatus.interview || 0) + (byStatus.technical || 0) + (byStatus.phone_screen || 0), icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-600/10', ring: 'hover:shadow-purple-500/20', glow: 'from-purple-500/60' },
    { label: 'Offers',      value: byStatus.offer || 0,             icon: Trophy,       color: 'text-green-400',  bg: 'bg-green-600/10',  ring: 'hover:shadow-green-500/20',  glow: 'from-green-500/60' },
    { label: 'Rejected',    value: byStatus.rejected || 0,          icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-600/10',    ring: 'hover:shadow-red-500/20',    glow: 'from-red-500/60' },
    { label: 'Avg Match',   value: `${stats?.avgMatchScore || 0}%`, icon: Sparkles,     color: 'text-yellow-400', bg: 'bg-yellow-600/10', ring: 'hover:shadow-yellow-500/20', glow: 'from-yellow-500/60' },
  ];

  return (
    <div className="relative space-y-6 max-w-6xl">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ok-animate-blob absolute -top-32 right-10 w-[28rem] h-[28rem] rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="ok-animate-blob absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-purple-600/25 blur-3xl" style={{ animationDelay: '6s' }} />
        <div className="ok-animate-blob absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-fuchsia-600/15 blur-3xl" style={{ animationDelay: '11s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between ok-animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ok-gradient-text">Overview</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track your internship journey</p>
        </div>
        <Link
          to="/applications/new"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
        >
          <Plus size={15} />
          Add Application
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, ring, glow }, i) => (
          <div
            key={label}
            className={`group relative overflow-hidden glass rounded-xl p-4 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-xl ${ring} transition-all duration-300 ok-animate-fade-up ok-delay-${(i % 5) + 1}`}
          >
            {/* top accent line */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        {pieData.length > 0 && (
          <div className="glass rounded-xl p-5 ok-animate-fade-up ok-delay-2">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Application Pipeline</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {barData.length > 0 && (
          <div className="glass rounded-xl p-5 ok-animate-fade-up ok-delay-3">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="status" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#a5b4fc' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="glass rounded-xl p-5 ok-animate-fade-up ok-delay-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-300">Recent Applications</h2>
            <Link to="/applications" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentApplications || []).length === 0 ? (
              <EmptyState />
            ) : (
              stats.recentApplications.map(app => (
                <Link
                  key={app._id}
                  to={`/applications/${app._id}`}
                  className="group flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{app.company}</div>
                    <div className="text-xs text-zinc-500">{app.role}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold tabular-nums ${getMatchColor(app.matchScore)}`}>
                      {app.matchScore}%
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass rounded-xl p-5 ok-animate-fade-up ok-delay-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-300">Upcoming Deadlines</h2>
            <Clock size={14} className="text-zinc-500" />
          </div>
          <div className="space-y-2">
            {(stats?.upcomingDeadlines || []).length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No upcoming deadlines</p>
            ) : (
              stats.upcomingDeadlines.map(app => {
                const dl = formatDeadline(app.deadline);
                return (
                  <Link
                    key={app._id}
                    to={`/applications/${app._id}`}
                    className="group flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{app.company}</div>
                      <div className="text-xs text-zinc-500">{app.role}</div>
                    </div>
                    {dl && (
                      <div className={`text-xs font-medium ${dl.urgent ? 'text-red-400' : 'text-yellow-400'}`}>
                        {dl.urgent ? '⚠️ ' : ''}{dl.label}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Briefcase size={28} className="text-zinc-700" />
      <p className="text-sm text-zinc-500">No applications yet</p>
      <Link
        to="/applications/new"
        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
      >
        <Plus size={12} /> Add your first application
      </Link>
    </div>
  );
}
