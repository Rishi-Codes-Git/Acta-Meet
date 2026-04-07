import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Action Items', href: '/action-items', icon: CheckSquare },
  { name: 'Teams', href: '/teams', icon: Users },
];

const secondaryNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Acta" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-display font-bold text-white">Acta</h1>
            <p className="text-xs text-slate-400">Meeting Intelligence</p>
          </div>
        </div>
      </div>

      {/* New Meeting Button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/meetings/new')}
          className="w-full flex items-center justify-center gap-2 bg-[#42A090] hover:bg-[#389080] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#42A090]/20"
        >
          <PlusCircle className="w-5 h-5" />
          New Meeting
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#42A090] text-white shadow-lg shadow-[#42A090]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}

        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settings
          </p>
        </div>

        {secondaryNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#42A090] text-white shadow-lg shadow-[#42A090]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-[#42A090] flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
