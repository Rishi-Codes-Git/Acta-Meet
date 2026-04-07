import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ListChecks,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Upload,
  Mic,
  FileText,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { meetingsApi } from '@/services/api';
import toast from 'react-hot-toast';

const meetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['daily_standup', 'client_meeting', 'sprint_planning', 'sprint_review', 'retrospective', 'leadership', 'general']),
  objective: z.string().optional(),
  meeting_date: z.string().min(1, 'Date is required'),
  meeting_time: z.string().min(1, 'Time is required'),
  duration_minutes: z.number().min(5).max(480).optional(),
  location: z.string().optional(),
  participants: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    role: z.string().optional(),
  })).min(1, 'At least one participant is required'),
  agenda_items: z.array(z.object({
    title: z.string().min(1, 'Agenda item is required'),
  })).optional(),
  discussion_text: z.string().optional(),
});

type MeetingForm = z.infer<typeof meetingSchema>;

const meetingTypes = [
  { value: 'daily_standup', label: 'Daily Standup', icon: '🌅' },
  { value: 'client_meeting', label: 'Client Meeting', icon: '🤝' },
  { value: 'sprint_planning', label: 'Sprint Planning', icon: '📋' },
  { value: 'sprint_review', label: 'Sprint Review', icon: '🔍' },
  { value: 'retrospective', label: 'Retrospective', icon: '🔄' },
  { value: 'leadership', label: 'Leadership', icon: '👔' },
  { value: 'general', label: 'General', icon: '📝' },
];

export default function NewMeetingPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MeetingForm>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      type: 'general',
      participants: [{ name: '', email: '', role: 'attendee' }],
      agenda_items: [{ title: '' }],
      discussion_text: '',
    },
  });

  const { fields: participantFields, append: addParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'participants',
  });

  const { fields: agendaFields, append: addAgenda, remove: removeAgenda } = useFieldArray({
    control,
    name: 'agenda_items',
  });

  const discussionText = watch('discussion_text');

  const onSubmit = async (data: MeetingForm) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const meetingDateTime = `${data.meeting_date}T${data.meeting_time}:00`;

      const meetingData = {
        title: data.title,
        type: data.type,
        objective: data.objective,
        meeting_date: meetingDateTime,
        duration_minutes: data.duration_minutes,
        location: data.location,
        participants: data.participants.filter(p => p.name.trim()),
        agenda_items: data.agenda_items?.filter(a => a.title.trim()).map(a => ({ title: a.title })),
        discussion_points: data.discussion_text ? [{ content: data.discussion_text }] : [],
      };

      const response = await meetingsApi.create(meetingData);
      const meetingId = response.data.id;

      toast.success('Meeting created successfully!');

      // If there's discussion text, offer to generate MoM
      if (data.discussion_text && data.discussion_text.trim().length > 50) {
        setIsGenerating(true);
        try {
          await meetingsApi.generateMom(meetingId);
          toast.success('MoM generated with AI!');
        } catch (err) {
          toast.error('Meeting saved, but MoM generation failed');
        }
        setIsGenerating(false);
      }

      navigate(`/meetings/${meetingId}`);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      toast.success(`Audio file selected: ${file.name}`);
    }
  };

  return (
    <MainLayout title="New Meeting" subtitle="Create a new meeting and generate MoM">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#42A090]" />
                Meeting Details
              </h2>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all ${
                      errors.title ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="Q2 Sprint Planning Meeting"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Meeting Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {meetingTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          watch('type') === type.value
                            ? 'border-[#42A090] bg-[#42A090]/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          {...register('type')}
                          className="sr-only"
                        />
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-sm font-medium text-slate-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        {...register('meeting_date')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all ${
                          errors.meeting_date ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {errors.meeting_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.meeting_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="time"
                        {...register('meeting_time')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all ${
                          errors.meeting_time ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {errors.meeting_time && (
                      <p className="mt-1 text-sm text-red-500">{errors.meeting_time.message}</p>
                    )}
                  </div>
                </div>

                {/* Objective */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Meeting Objective
                  </label>
                  <textarea
                    {...register('objective')}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all resize-none"
                    placeholder="What is the goal of this meeting?"
                  />
                </div>
              </div>
            </div>

            {/* Participants Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#42A090]" />
                  Participants
                </h2>
                <button
                  type="button"
                  onClick={() => addParticipant({ name: '', email: '', role: 'attendee' })}
                  className="flex items-center gap-1 text-sm text-[#42A090] hover:text-[#389080] font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {participantFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        {...register(`participants.${index}.name`)}
                        placeholder="Name"
                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        {...register(`participants.${index}.email`)}
                        placeholder="Email (optional)"
                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all"
                      />
                    </div>
                    <select
                      {...register(`participants.${index}.role`)}
                      className="px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all"
                    >
                      <option value="attendee">Attendee</option>
                      <option value="organizer">Organizer</option>
                      <option value="presenter">Presenter</option>
                    </select>
                    {participantFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.participants && (
                <p className="mt-2 text-sm text-red-500">{errors.participants.message}</p>
              )}
            </div>

            {/* Agenda Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-[#42A090]" />
                  Agenda
                </h2>
                <button
                  type="button"
                  onClick={() => addAgenda({ title: '' })}
                  className="flex items-center gap-1 text-sm text-[#42A090] hover:text-[#389080] font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {agendaFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-[#42A090]/10 text-[#42A090] text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <input
                      {...register(`agenda_items.${index}.title`)}
                      placeholder="Agenda item..."
                      className="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all"
                    />
                    {agendaFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAgenda(index)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Discussion Input Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#42A090]" />
                Discussion Notes
              </h2>

              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-[#42A090] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Text Input
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('audio')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    inputMode === 'audio'
                      ? 'bg-[#42A090] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  Audio Upload
                </button>
              </div>

              {inputMode === 'text' ? (
                <div>
                  <textarea
                    {...register('discussion_text')}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all resize-none"
                    placeholder="Paste or type the meeting discussion notes here...

Example:
John: Let's discuss the Q2 roadmap. We need to prioritize the API redesign.
Sarah: I agree. I can take the lead on documentation. Target completion by April 15th.
Mike: I'll handle the backend migration. Should be done in 2 weeks.
John: Great. Let's also review the client feedback from last sprint..."
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    {discussionText?.length || 0} characters
                    {discussionText && discussionText.length > 50 && (
                      <span className="text-[#42A090] ml-2">✓ Ready for AI processing</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label
                    htmlFor="audio-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#42A090]/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-[#42A090]" />
                    </div>
                    {audioFile ? (
                      <>
                        <p className="text-sm font-medium text-slate-900">{audioFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900">
                          Click to upload audio file
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          MP3, WAV, M4A up to 25MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Submit Card */}
            <div className="bg-gradient-to-br from-[#42A090] to-[#2d7a6d] rounded-2xl p-6 text-white">
              <h3 className="font-display font-bold text-lg mb-3">Ready to Create?</h3>
              <p className="text-teal-100 text-sm mb-6">
                Save the meeting and let AI generate your Minutes of Meeting automatically.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || isGenerating}
                className="w-full bg-white text-[#42A090] font-bold py-3 px-4 rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    Generating MoM...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create & Generate MoM
                  </>
                )}
              </button>
            </div>

            {/* Tips Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-display font-bold text-slate-900 mb-4">💡 Tips for Best Results</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-[#42A090]">•</span>
                  Include speaker names in discussion (e.g., "John: ...")
                </li>
                <li className="flex gap-2">
                  <span className="text-[#42A090]">•</span>
                  Mention deadlines explicitly (e.g., "by April 15th")
                </li>
                <li className="flex gap-2">
                  <span className="text-[#42A090]">•</span>
                  Clearly state decisions made
                </li>
                <li className="flex gap-2">
                  <span className="text-[#42A090]">•</span>
                  Name assignees for action items
                </li>
              </ul>
            </div>

            {/* AI Features Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-display font-bold text-slate-900 mb-4">🤖 AI Will Extract</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-[#42A090]"></div>
                  Discussion summary
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Key decisions made
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Action items with owners
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Deadlines & priorities
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
