import React from 'react';
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
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: 'teal' | 'blue' | 'orange' | 'purple';
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, color }: StatCardProps) {
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
          <p className="text-3xl font-display font-bold text-slate-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm font-medium mt-2 ${changeColors[changeType]}`}>
              {change}
            </p>
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
    standup: 'bg-blue-100 text-blue-700',
    sprint_planning: 'bg-purple-100 text-purple-700',
    client: 'bg-orange-100 text-orange-700',
    review: 'bg-teal-100 text-teal-700',
    retrospective: 'bg-pink-100 text-pink-700',
    leadership: 'bg-amber-100 text-amber-700',
    default: 'bg-slate-100 text-slate-700',
  };

  const typeLabels: Record<string, string> = {
    standup: 'Standup',
    sprint_planning: 'Sprint Planning',
    client: 'Client Meeting',
    review: 'Review',
    retrospective: 'Retrospective',
    leadership: 'Leadership',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyles[type] || typeStyles.default}`}>
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock data - will be replaced with API calls
  const stats = {
    totalMeetings: 24,
    totalActionItems: 67,
    completedTasks: 45,
    pendingTasks: 22,
  };

  const recentMeetings = [
    {
      id: '1',
      title: 'Q2 Sprint Planning',
      type: 'sprint_planning',
      date: '2026-04-07',
      time: '10:00 AM',
      participants: 8,
      actionItems: 5,
    },
    {
      id: '2',
      title: 'Client Onboarding - Acme Corp',
      type: 'client',
      date: '2026-04-06',
      time: '2:00 PM',
      participants: 4,
      actionItems: 3,
    },
    {
      id: '3',
      title: 'Daily Standup',
      type: 'standup',
      date: '2026-04-06',
      time: '9:30 AM',
      participants: 6,
      actionItems: 2,
    },
    {
      id: '4',
      title: 'Product Review Meeting',
      type: 'review',
      date: '2026-04-05',
      time: '3:00 PM',
      participants: 10,
      actionItems: 7,
    },
  ];

  const myActionItems = [
    {
      id: '1',
      title: 'Update API documentation for v2 endpoints',
      priority: 'high' as const,
      status: 'in_progress',
      deadline: '2026-04-08',
      meeting: 'Q2 Sprint Planning',
    },
    {
      id: '2',
      title: 'Review and approve design mockups',
      priority: 'medium' as const,
      status: 'pending',
      deadline: '2026-04-09',
      meeting: 'Product Review Meeting',
    },
    {
      id: '3',
      title: 'Set up CI/CD pipeline for staging',
      priority: 'high' as const,
      status: 'pending',
      deadline: '2026-04-07',
      meeting: 'Daily Standup',
    },
    {
      id: '4',
      title: 'Prepare demo for client presentation',
      priority: 'high' as const,
      status: 'in_progress',
      deadline: '2026-04-10',
      meeting: 'Client Onboarding',
    },
  ];

  const upcomingDeadlines = myActionItems
    .filter(item => item.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const completionRate = Math.round((stats.completedTasks / stats.totalActionItems) * 100);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <MainLayout title="Dashboard" subtitle={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}!`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Meetings"
          value={stats.totalMeetings}
          change="+3 this week"
          changeType="positive"
          icon={Calendar}
          color="teal"
        />
        <StatCard
          title="Action Items"
          value={stats.totalActionItems}
          change={`${stats.pendingTasks} pending`}
          changeType="neutral"
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          change="+5% from last week"
          changeType="positive"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Overdue Tasks"
          value={3}
          change="Needs attention"
          changeType="negative"
          icon={AlertCircle}
          color="orange"
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
                          {meeting.date} at {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {meeting.actionItems} action items
                        </span>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-[#42A090] hover:bg-teal-50 rounded-lg transition-colors">
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

            <div className="divide-y divide-slate-50">
              {myActionItems.slice(0, 4).map((item) => (
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
                      <p className="text-xs text-slate-400 mt-1.5">
                        Due: {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-gradient-to-br from-[#42A090] to-[#2d7a6d] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display font-bold">Upcoming Deadlines</h2>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-teal-100">
                      {new Date(item.deadline).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-100' :
                      item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-100' :
                      'bg-green-500/20 text-green-100'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/action-items')}
              className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Manage all tasks
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
