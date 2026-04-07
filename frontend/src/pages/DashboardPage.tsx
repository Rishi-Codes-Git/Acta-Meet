import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  FileText,
  Users,
  Target,
  Zap,
  Loader2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { dashboardApi, meetingsApi, actionItemsApi } from '@/services/api';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: 'teal' | 'blue' | 'orange' | 'purple';
  loading?: boolean;
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, color, loading }: StatCardProps) {
  const colorClasses = {
    teal: 'bg-[#42A090]/10 text-[#42A090]',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-500',
    neutral: 'text-slate-500',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="h-9 flex items-center mt-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-display font-bold text-slate-900 mt-2">{value}</p>
              {change && (
                <p className={`text-sm font-medium mt-2 ${changeColors[changeType]}`}>
                  {change}
                </p>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Meeting Type Badge
function MeetingTypeBadge({ type }: { type: string }) {
  const typeStyles: Record<string, string> = {
    daily_standup: 'bg-blue-100 text-blue-700',
    sprint_planning: 'bg-purple-100 text-purple-700',
    client_meeting: 'bg-orange-100 text-orange-700',
    sprint_review: 'bg-teal-100 text-teal-700',
    retrospective: 'bg-pink-100 text-pink-700',
    leadership: 'bg-amber-100 text-amber-700',
    general: 'bg-slate-100 text-slate-700',
  };

  const typeLabels: Record<string, string> = {
    daily_standup: 'Standup',
    sprint_planning: 'Sprint Planning',
    client_meeting: 'Client Meeting',
    sprint_review: 'Review',
    retrospective: 'Retrospective',
    leadership: 'Leadership',
    general: 'General',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyles[type] || typeStyles.general}`}>
      {typeLabels[type] || type}
    </span>
  );
}

// Priority Badge
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  meeting_date: string;
  participant_count?: number;
  action_item_count?: number;
}

interface ActionItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  deadline?: string;
  meeting_title?: string;
}

interface DashboardStats {
  total_meetings: number;
  total_action_items: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_meetings: 0,
    total_action_items: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [myActionItems, setMyActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [meetingsRes, actionItemsRes] = await Promise.all([
        meetingsApi.getAll({ page: 1 }).catch(() => ({ data: [] })),
        actionItemsApi.getMy().catch(() => ({ data: [] })),
      ]);

      const meetings = meetingsRes.data || [];
      const actionItems = actionItemsRes.data || [];

      setRecentMeetings(meetings.slice(0, 5));
      setMyActionItems(actionItems.slice(0, 5));

      // Calculate stats
      const completed = actionItems.filter((a: ActionItem) => a.status === 'completed').length;
      const pending = actionItems.filter((a: ActionItem) => a.status === 'pending').length;
      const overdue = actionItems.filter((a: ActionItem) => 
        a.deadline && new Date(a.deadline) < new Date() && a.status !== 'completed'
      ).length;

      setStats({
        total_meetings: meetings.length,
        total_action_items: actionItems.length,
        completed_tasks: completed,
        pending_tasks: pending,
        overdue_tasks: overdue,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats.total_action_items > 0 
    ? Math.round((stats.completed_tasks / stats.total_action_items) * 100) 
    : 0;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <MainLayout title="Dashboard" subtitle={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}!`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Meetings"
          value={stats.total_meetings}
          icon={Calendar}
          color="teal"
          loading={loading}
        />
        <StatCard
          title="Action Items"
          value={stats.total_action_items}
          change={stats.pending_tasks > 0 ? `${stats.pending_tasks} pending` : undefined}
          changeType="neutral"
          icon={CheckSquare}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue_tasks}
          change={stats.overdue_tasks > 0 ? "Needs attention" : "All on track"}
          changeType={stats.overdue_tasks > 0 ? "negative" : "positive"}
          icon={AlertCircle}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Meetings - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#42A090]/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#42A090]" />
                </div>
                <h2 className="text-lg font-display font-bold text-slate-900">Recent Meetings</h2>
              </div>
              <button
                onClick={() => navigate('/meetings')}
                className="text-sm text-[#42A090] hover:text-[#389080] font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                <p className="text-slate-400 mt-2">Loading meetings...</p>
              </div>
            ) : recentMeetings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No meetings yet</h3>
                <p className="text-slate-500 text-sm mb-4">Create your first meeting to get started</p>
                <button
                  onClick={() => navigate('/meetings/new')}
                  className="bg-[#42A090] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#389080] transition-colors"
                >
                  Create Meeting
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
                          <MeetingTypeBadge type={meeting.type} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(meeting.meeting_date)} at {formatTime(meeting.meeting_date)}
                          </span>
                          {meeting.participant_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {meeting.participant_count} participants
                            </span>
                          )}
                          {meeting.action_item_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {meeting.action_item_count} action items
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-[#42A090] hover:bg-teal-50 rounded-lg transition-colors">
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* My Action Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-display font-bold text-slate-900">My Tasks</h2>
              </div>
              <button
                onClick={() => navigate('/action-items')}
                className="text-sm text-[#42A090] hover:text-[#389080] font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
              </div>
            ) : myActionItems.length === 0 ? (
              <div className="p-8 text-center">
                <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No tasks assigned to you</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {myActionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.status === 'completed'}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#42A090] focus:ring-[#42A090]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <PriorityBadge priority={item.priority} />
                          <StatusBadge status={item.status} />
                        </div>
                        {item.deadline && (
                          <p className="text-xs text-slate-400 mt-1.5">
                            Due: {formatDate(item.deadline)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#42A090] to-[#2d7a6d] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display font-bold">Quick Actions</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/meetings/new')}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                New Meeting
              </button>
              <button
                onClick={() => navigate('/action-items')}
                className="w-full bg-white/10 hover:bg-white/20 text-white/90 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
