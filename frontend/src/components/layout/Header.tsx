import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { notificationsApi } from '@/services/api';

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: string;
  read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    void loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationsApi.getMy();
      const notifs = res.data || [];
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="w-64 pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#42A090]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                           className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                             !notif.read ? 'bg-teal-50/50' : ''
                            }`}
                          >
                          <div className="flex items-start gap-3">
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-[#42A090] mt-2 flex-shrink-0" />
                            )}
                            <div className={!notif.read ? '' : 'pl-5'}>
                               <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                               {notif.message && (
                                 <p className="text-sm text-slate-500 line-clamp-2">{notif.message}</p>
                                )}
                               <p className="text-xs text-slate-400 mt-1">{formatTime(notif.created_at)}</p>
                              </div>
                            </div>
                          </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-slate-50">
                    <button className="w-full text-sm text-[#42A090] hover:text-[#389080] font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar (Mobile) */}
          <div className="w-9 h-9 rounded-full bg-[#42A090] flex items-center justify-center text-white font-bold text-sm md:hidden">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
