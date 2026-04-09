import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Download,
  CheckSquare,
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  User,
  Target,
  ListChecks,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { meetingsApi, actionItemsApi } from '@/services/api';
import toast from 'react-hot-toast';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

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
}

interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: string;
  attended?: boolean;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface DiscussionPoint {
  id: string;
  content: string;
  speaker?: string;
  summary?: string;
  created_at: string;
}

interface Decision {
  id: string;
  content: string;
  decided_by?: string;
  decided_by_id?: string;
}

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  deadline?: string;
}

interface MomDocument {
  meeting: Meeting;
  summary: string;
  decisions: Decision[];
  action_items: ActionItem[];
  agenda_items: AgendaItem[];
  participants: Participant[];
  discussion_points: DiscussionPoint[];
  generated_at: string;
}

// Backend returns flat structure with all fields at top level
interface MeetingDetailResponse extends Meeting {
  participants: Participant[];
  agenda_items: AgendaItem[];
  discussion_points: DiscussionPoint[];
  decisions: Decision[];
  action_items: ActionItem[];
  mom?: MomDocument | null;
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingDetailResponse | null>(null);

  useEffect(() => {
    if (id) {
      loadMeetingDetails();
    }
  }, [id]);

  const loadMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await meetingsApi.getById(id!);
      setMeetingData(response.data);
    } catch (error: any) {
      console.error('Failed to load meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMom = async () => {
    try {
      setGenerating(true);
      await meetingsApi.generateMom(id!);
      toast.success('MoM generated successfully!');
      await loadMeetingDetails(); // Reload to get the generated MoM
    } catch (error: any) {
      console.error('Failed to generate MoM:', error);
      toast.error(error.response?.data?.error || 'Failed to generate MoM');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await meetingsApi.downloadPdf(id!);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MoM_${meetingData?.title}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to download PDF');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await meetingsApi.downloadDocx(id!);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MoM_${meetingData?.title}_${id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Word document downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download DOCX:', error);
      toast.error(error.response?.data?.error || 'Failed to download Word document');
    }
  };

  const handleUpdateActionItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await actionItemsApi.updateStatus(itemId, newStatus);
      toast.success('Status updated successfully!');
      await loadMeetingDetails(); // Reload to update action items
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meetingData) return;

    const confirmed = window.confirm(`Delete "${meetingData.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      await meetingsApi.delete(meetingData.id);
      toast.success('Meeting deleted');
      navigate('/meetings');
    } catch (error: any) {
      console.error('Failed to delete meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to delete meeting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Meeting Details">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#42A090]" />
        </div>
      </MainLayout>
    );
  }

  if (!meetingData) {
    return (
      <MainLayout title="Meeting Details">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Meeting not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-[#42A090] hover:underline"
          >
            Go back to dashboard
          </button>
        </div>
      </MainLayout>
    );
  }

  // Destructure directly from the flat response
  const {
    title,
    objective,
    meeting_date,
    duration_minutes,
    location,
    participants,
    agenda_items,
    discussion_points,
    mom,
    action_items,
  } = meetingData;

  return (
    <MainLayout title={title} subtitle="Meeting details and generated MoM">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                {title}
              </h1>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(meeting_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(meeting_date)}</span>
                </div>
                {duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{duration_minutes} min</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteMeeting}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
              {mom ? (
                <>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Word</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGenerateMom}
                  disabled={generating || discussion_points.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#42A090] text-white rounded-lg hover:bg-[#358070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate MoM</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {objective && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-900">
                <span className="font-semibold">Objective: </span>
                {objective}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#42A090]" />
                <h2 className="text-xl font-semibold text-slate-900">Participants</h2>
                <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  {participants.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#42A090] text-white flex items-center justify-center font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{participant.name}</p>
                      {participant.email && (
                        <p className="text-sm text-slate-500 truncate">{participant.email}</p>
                      )}
                      {participant.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white text-slate-600 text-xs rounded-full">
                          {participant.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda */}
            {agenda_items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-[#42A090]" />
                  <h2 className="text-xl font-semibold text-slate-900">Agenda</h2>
                </div>
                <div className="space-y-2">
                  {agenda_items
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((item, index) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#42A090] text-white text-sm flex items-center justify-center font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Discussion Points */}
            {discussion_points.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#42A090]" />
                  <h2 className="text-xl font-semibold text-slate-900">Discussion</h2>
                </div>
                <div className="space-y-4">
                  {discussion_points.map((point) => (
                    <div key={point.id} className="p-4 bg-slate-50 rounded-lg">
                      {point.speaker && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-semibold text-slate-700">
                            {point.speaker}
                          </span>
                        </div>
                      )}
                      <p className="text-slate-800 whitespace-pre-wrap">{point.content}</p>
                      {point.summary && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-sm text-slate-600 italic">{point.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated MoM */}
            {mom && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-teal-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#42A090]" />
                  <h2 className="text-xl font-semibold text-slate-900">Generated Minutes</h2>
                  <span className="ml-auto text-xs text-slate-500">
                    {formatDateTime(mom.generated_at)}
                  </span>
                </div>

                {/* Summary */}
                {mom.summary && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Summary</h3>
                    <p className="text-slate-800 bg-white/60 p-4 rounded-lg whitespace-pre-wrap">
                      {mom.summary}
                    </p>
                  </div>
                )}

                {/* Decisions */}
                {mom.decisions && mom.decisions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Decisions Made</h3>
                    <div className="space-y-3">
                      {mom.decisions.map((decision, index) => (
                        <div key={decision.id || index} className="bg-white/60 p-4 rounded-lg">
                          <p className="text-slate-800">{decision.content}</p>
                          {decision.decided_by && decision.decided_by !== 'null' && (
                            <p className="text-sm text-slate-600 mt-2">
                              Decided by: <span className="font-medium">{decision.decided_by}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Action Items */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#42A090]" />
                <h2 className="text-xl font-semibold text-slate-900">Action Items</h2>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  {action_items.length}
                </span>
              </div>

              {action_items.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {mom ? 'No action items extracted' : 'Generate MoM to extract action items'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {action_items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 flex-1 pr-2">{item.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : item.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                      )}

                      {item.assignee_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">{item.assignee_name}</span>
                        </div>
                      )}

                      {item.deadline && (
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {formatDate(item.deadline)}
                          </span>
                        </div>
                      )}

                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateActionItemStatus(item.id, e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-colors ${
                          item.status === 'completed'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : item.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : item.status === 'blocked'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
