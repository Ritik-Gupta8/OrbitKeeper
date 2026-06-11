import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { getApplications, deleteApplication } from '../lib/api.js';
import { formatDeadline, STATUS_CONFIG } from '../lib/utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import MatchScore from '../components/MatchScore.jsx';
import { PageLoader } from '../components/LoadingSpinner.jsx';

const STATUS_OPTIONS = ['all', ...Object.keys(STATUS_CONFIG)];

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const fetchApps = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await getApplications(params);
      setApplications(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchApps, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this application?')) return;
    await deleteApplication(id);
    setApplications(prev => prev.filter(a => a._id !== id));
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const sorted = [...applications].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === 'matchScore') { va = +va; vb = +vb; }
    if (sortBy === 'deadline') { va = va ? new Date(va) : 0; vb = vb ? new Date(vb) : 0; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => sortBy === field
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronUp size={12} className="opacity-20" />;

  if (loading) return <PageLoader text="Loading applications..." />;

  return (
    <div className="relative space-y-4 max-w-6xl">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ok-animate-blob absolute -top-32 right-10 w-[28rem] h-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="ok-animate-blob absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-purple-600/20 blur-3xl" style={{ animationDelay: '6s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between ok-animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ok-gradient-text">Applications</span>
          </h1>
          <p className="text-sm text-zinc-500">{applications.length} total</p>
        </div>
        <Link
          to="/applications/new"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
        >
          <Plus size={15} /> Add Application
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap ok-animate-fade-up ok-delay-1">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search company, role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-zinc-500" />
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full transition-all capitalize active:scale-95 ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="glass rounded-xl overflow-hidden ok-animate-fade-up ok-delay-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {[
                    { field: 'company', label: 'Company' },
                    { field: 'role', label: 'Role' },
                    { field: 'matchScore', label: 'Match' },
                    { field: 'status', label: 'Status' },
                    { field: 'deadline', label: 'Deadline' },
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="text-left text-xs font-medium text-zinc-500 px-4 py-3 cursor-pointer hover:text-zinc-300 select-none"
                    >
                      <div className="flex items-center gap-1">
                        {label} <SortIcon field={field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sorted.map(app => {
                  const dl = app.deadline ? formatDeadline(app.deadline) : null;
                  return (
                    <tr
                      key={app._id}
                      className="group hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/applications/${app._id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">{app.company}</div>
                        {app.location && <div className="text-xs text-zinc-500">{app.location}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{app.role}</td>
                      <td className="px-4 py-3">
                        <MatchScore score={app.matchScore || 0} showBar />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3">
                        {dl ? (
                          <span className={`text-xs ${dl.past ? 'text-zinc-600' : dl.urgent ? 'text-red-400' : 'text-zinc-400'}`}>
                            {dl.past ? 'Passed' : dl.label}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleDelete(app._id, e)}
                          className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="glass rounded-xl p-12 flex flex-col items-center gap-3 text-center ok-animate-fade-up">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
        <ExternalLink size={20} className="text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">
        {search ? 'No results found' : 'No applications yet'}
      </h3>
      <p className="text-xs text-zinc-500 max-w-xs">
        {search ? `No applications match "${search}"` : 'Start tracking your internship applications.'}
      </p>
      {!search && (
        <Link
          to="/applications/new"
          className="mt-2 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
        >
          <Plus size={14} /> Add your first application
        </Link>
      )}
    </div>
  );
}
