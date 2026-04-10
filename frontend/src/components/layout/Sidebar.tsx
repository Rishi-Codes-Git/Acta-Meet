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

const toAbsoluteAssetUrl = (assetPath?: string) => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f3f3a] text-slate-100 border-r border-[#1c5b53] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[#1c5b53] bg-[#0f3f3a]">
        <div className="flex items-center gap-3">
          <video
            src="/acta-logo.mp4"
            className="w-12 h-12 rounded-lg object-cover"
            autoPlay
            loop
            muted
            playsInline
            aria-label="Acta logo animation"
          />
          <div>
            <h1 className="text-xl font-display font-bold text-white">Acta</h1>
            <p className="text-xs text-teal-100">Your Meetings Organized</p>
            <div className="mt-1 flex items-center gap-1.5">
              <img src="/propel-logo.webp" alt="Propel Soft" className="w-4 h-4 rounded-sm object-cover" />
              <p className="text-[10px] font-semibold text-white">Powered by Propel Soft</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Meeting Button */}
      <div className="p-4 bg-[#0f3f3a]">
        <button
          onClick={() => navigate('/meetings/new')}
          className="w-full flex items-center justify-center gap-2 bg-[#42A090] hover:bg-[#389080] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#42A090]/20"
        >
          <PlusCircle className="w-5 h-5" />
          New Meeting
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-[#0f3f3a]">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#42A090] text-white shadow-lg shadow-[#42A090]/20'
                  : 'text-teal-100 hover:text-white hover:bg-[#1c5b53]'
               }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}

        {secondaryNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#42A090] text-white shadow-lg shadow-[#42A090]/20'
                  : 'text-teal-100 hover:text-white hover:bg-[#1c5b53]'
               }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#1c5b53] bg-[#0f3f3a]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c5b53]">
          {user?.avatar_url ? (
            <img
              src={toAbsoluteAssetUrl(user.avatar_url)}
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover border border-teal-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#42A090] flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-teal-100 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-teal-100 hover:text-white hover:bg-[#2a6f67] rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
