import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, MessageSquare, User,
  ChevronLeft, ChevronRight, Sparkles, Bell, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { logOut } from '../lib/firebase.js';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: Briefcase,        label: 'Applications' },
  { to: '/copilot',      icon: MessageSquare,    label: 'AI Copilot' },
  { to: '/profile',      icon: User,             label: 'Profile' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {/* Logo */}
        <div className={cn('flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800', collapsed && 'justify-center px-0')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-zinc-100 leading-none">Orbit</div>
              <div className="text-xs text-indigo-400 leading-none mt-0.5">Keeper</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
          <TopbarTitle />
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <Bell size={14} className="text-zinc-400" />
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-xs text-zinc-300 max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-600 flex items-center justify-center transition-colors group"
                  title="Logout"
                >
                  <LogOut size={14} className="text-zinc-400 group-hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopbarTitle() {
  const location = useLocation();
  const titles = {
    '/dashboard': 'Dashboard',
    '/applications': 'Application Tracker',
    '/applications/new': 'New Application',
    '/copilot': 'AI Copilot',
    '/profile': 'Profile',
  };
  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'OrbitKeeper';
  return <h1 className="text-sm font-medium text-zinc-300">{title}</h1>;
}
