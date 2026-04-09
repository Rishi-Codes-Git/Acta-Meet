// Meeting Types
export type MeetingType = 
  | 'daily_standup' 
  | 'client_meeting' 
  | 'sprint_planning'
  | 'sprint_review' 
  | 'retrospective' 
  | 'leadership' 
  | 'general';

export type PriorityLevel = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type NotificationType = 'task_assigned' | 'task_updated' | 'deadline_reminder' | 'mom_generated';

// Corporate role hierarchy (higher number = higher rank)
export type UserRole = 'intern' | 'associate' | 'team_lead' | 'manager' | 'executive' | 'admin';
export type TeamMemberRole = 'member' | 'lead' | 'manager' | 'admin';
export type ParticipantRole = 'attendee' | 'presenter' | 'organizer';

// Role permission levels for action item creation
export const RolePermissionLevel: Record<UserRole, number> = {
  'intern': 0,
  'associate': 1,
  'team_lead': 2,
  'manager': 3,
  'executive': 4,
  'admin': 5,
};

export const MinimumRoleForActionItem = 2; // team_lead and above

// Database Models
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  objective?: string;
  meeting_date: Date;
  duration_minutes?: number;
  location?: string;
  created_by?: string;
  team_id?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Participant {
  id: string;
  meeting_id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: string;
  attended: boolean;
}

export interface AgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  order_index: number;
}

export interface DiscussionPoint {
  id: string;
  meeting_id: string;
  content: string;
  summary?: string;
  speaker?: string;
  speaker_id?: string;
}

export interface Decision {
  id: string;
  meeting_id: string;
  content: string;
  decided_by?: string;
  decided_by_id?: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  assignee_name?: string;
  assignee_id?: string;
  assigned_by?: string;
  priority: PriorityLevel;
  status: ActionStatus;
  deadline?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  assignee_email?: string;
  meeting_title?: string;
}

export interface MomDocument {
  id: string;
  meeting_id: string;
  content: any;
  pdf_path?: string;
  docx_path?: string;
  generated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  reference_id?: string;
  reference_type?: string;
  read: boolean;
  created_at: Date;
}

// API Request/Response Types
export interface CreateMeetingRequest {
  title: string;
  type: MeetingType;
  objective?: string;
  meeting_date: string;
  duration_minutes?: number;
  location?: string;
  team_id?: string;
  participants?: { name: string; email?: string; role?: string; user_id?: string }[];
  agenda_items?: { title: string; description?: string }[];
  discussion_points?: { content: string; speaker?: string }[];
}

export interface GenerateMomRequest {
  meeting_id: string;
}

export interface MomContent {
  meeting: Meeting;
  participants: Participant[];
  agenda_items: AgendaItem[];
  discussion_points: DiscussionPoint[];
  summary: string;
  key_points: string[];
  decisions: Decision[];
  action_items: ActionItem[];
  generated_at: Date;
}

// OpenAI Response Types
export interface AIExtractionResult {
  summary: string;
  decisions: { decision: string; decided_by?: string }[];
  action_items: {
    task: string;
    assignee?: string;
    deadline?: string;
    priority: PriorityLevel;
  }[];
}

// User matching helper
export interface ParticipantMatch {
  name: string;
  email?: string;
  user_id?: string;
}
