import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { meetingsApi } from '@/services/api';
import toast from 'react-hot-toast';

interface Meeting {
  id: string;
  title: string;
  type: string;
  objective?: string;
  meeting_date: string;
  duration_minutes?: number;
  location?: string;
  status: string;
  created_at: string;
  participant_count?: number;
}

const meetingTypes = [
  { value: '', label: 'All Types' },
  { value: 'daily_standup', label: 'Daily Standup' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'sprint_planning', label: 'Sprint Planning' },
  { value: 'sprint_review', label: 'Sprint Review' },
  { value: 'retrospective', label: 'Retrospective' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'general', label: 'General' },
];

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

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, [typeFilter, statusFilter]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      
      const response = await meetingsApi.getAll(params);
      setMeetings(response.data.meetings || response.data || []);
    } catch (error: any) {
      console.error('Failed to load meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    const confirmed = window.confirm(`Delete "${meetingTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingMeetingId(meetingId);
      await meetingsApi.delete(meetingId);
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));
      toast.success('Meeting deleted');
    } catch (error: any) {
      console.error('Failed to delete meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to delete meeting');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  // Filter meetings by search query (client-side)
  const filteredMeetings = meetings.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.type.toLowerCase().includes(query) ||
      meeting.objective?.toLowerCase().includes(query)
    );
  });

  // Group meetings by date
  const groupedMeetings = filteredMeetings.reduce((groups, meeting) => {
    const date = new Date(meeting.meeting_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meeting);
    return groups;
  }, {} as Record<string, Meeting[]>);

  // Sort dates (most recent first)
  const sortedDates = Object.keys(groupedMeetings).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <MainLayout title="Meetings" subtitle="View and manage all your meetings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Meetings</h1>
            <p className="text-slate-600 mt-1">View and manage all your meetings</p>
          </div>
          <button
            onClick={() => navigate('/meetings/new')}
            className="flex items-center gap-2 bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#42A090]/20"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="min-w-[180px]">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent appearance-none cursor-pointer"
                >
                  {meetingTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#42A090]" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No meetings found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || typeFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Create your first meeting to get started'}
            </p>
            {!searchQuery && !typeFilter && !statusFilter && (
              <button
                onClick={() => navigate('/meetings/new')}
                className="inline-flex items-center gap-2 bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((dateStr) => (
              <div key={dateStr}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#42A090]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#42A090]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {formatDate(dateStr)}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {groupedMeetings[dateStr].length} meeting{groupedMeetings[dateStr].length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Meetings for this date */}
                <div className="space-y-3 ml-[52px]">
                  {groupedMeetings[dateStr].map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-[#42A090]/30 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          onClick={() => navigate(`/meetings/${meeting.id}`)}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#42A090] transition-colors">
                              {meeting.title}
                            </h3>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                typeStyles[meeting.type] || typeStyles.general
                              }`}
                            >
                              {typeLabels[meeting.type] || meeting.type}
                            </span>
                            {meeting.status === 'completed' ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                <FileText className="w-3 h-3" />
                                Draft
                              </span>
                            )}
                          </div>

                          {meeting.objective && (
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                              {meeting.objective}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(meeting.meeting_date)}</span>
                            </div>
                            {meeting.duration_minutes && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300">•</span>
                                <span>{meeting.duration_minutes} min</span>
                              </div>
                            )}
                            {meeting.location && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300">•</span>
                                <span>{meeting.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-3">
                          <button
                            type="button"
                            onClick={() => void handleDeleteMeeting(meeting.id, meeting.title)}
                            disabled={deletingMeetingId === meeting.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
                            title="Delete meeting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/meetings/${meeting.id}`)}
                            className="p-2 text-slate-400 hover:text-[#42A090] hover:bg-teal-50 rounded-lg transition-colors"
                            title="View meeting"
                          >
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && filteredMeetings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#42A090]"></div>
                <span>
                  <strong className="text-slate-900">{filteredMeetings.length}</strong> total meetings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>
                  <strong className="text-slate-900">
                    {filteredMeetings.filter((m) => m.status === 'completed').length}
                  </strong>{' '}
                  completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>
                  <strong className="text-slate-900">
                    {filteredMeetings.filter((m) => m.status === 'draft').length}
                  </strong>{' '}
                  drafts
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
