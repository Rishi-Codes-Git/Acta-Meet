import { pool } from './index';

const schema = `
-- Drop existing tables (for fresh setup)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS external_task_mappings CASCADE;
DROP TABLE IF EXISTS integration_config CASCADE;
DROP TABLE IF EXISTS trello_connections CASCADE;
DROP TABLE IF EXISTS jira_connections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transcriptions CASCADE;
DROP TABLE IF EXISTS mom_documents CASCADE;
DROP TABLE IF EXISTS action_items CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS discussion_points CASCADE;
DROP TABLE IF EXISTS agenda_items CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS meeting_type CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS action_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create types
CREATE TYPE meeting_type AS ENUM (
    'daily_standup', 'client_meeting', 'sprint_planning',
    'sprint_review', 'retrospective', 'leadership', 'general'
);

CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_updated', 'deadline_reminder', 'mom_generated');

-- Users table (enhanced with role)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table (for organizing users)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team members (many-to-many)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Meetings table (enhanced)
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    type meeting_type NOT NULL DEFAULT 'general',
    objective TEXT,
    meeting_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    location VARCHAR(255),
    created_by UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Participants table (enhanced - linked to users)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'attendee',
    attended BOOLEAN DEFAULT true,
    UNIQUE(meeting_id, email)
);

-- Agenda items table
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

-- Discussion points table
CREATE TABLE discussion_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    summary TEXT,
    speaker VARCHAR(255),
    speaker_id UUID REFERENCES users(id)
);

-- Decisions table
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    decided_by VARCHAR(255),
    decided_by_id UUID REFERENCES users(id)
);

-- Action items table (enhanced - linked to users)
CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_name VARCHAR(255),
    assignee_id UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    priority priority_level DEFAULT 'medium',
    status action_status DEFAULT 'pending',
    deadline DATE,
    completed_at TIMESTAMP,
    external_source VARCHAR(50),
    external_id VARCHAR(255),
    sync_status VARCHAR(50) DEFAULT 'not_synced',
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MoM documents table
CREATE TABLE mom_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    pdf_path VARCHAR(500),
    docx_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    audio_path VARCHAR(500),
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table (for in-app notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Jira OAuth Connections
CREATE TABLE jira_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_url VARCHAR(255) NOT NULL,
    oauth_token TEXT NOT NULL,
    oauth_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    scope TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, workspace_url)
);

-- Trello OAuth Connections
CREATE TABLE trello_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    oauth_token TEXT NOT NULL,
    workspace_id VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Map Acta action items to external tasks
CREATE TABLE external_task_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_item_id UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
    external_source VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    external_url VARCHAR(500),
    external_key VARCHAR(100),
    synced_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP,
    sync_direction VARCHAR(50) DEFAULT 'bidirectional',
    sync_status VARCHAR(50) DEFAULT 'synced',
    sync_error_message TEXT,
    UNIQUE(action_item_id, external_source),
    UNIQUE(external_source, external_id)
);

-- Log webhook events
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_source VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    received_at TIMESTAMP DEFAULT NOW()
);

-- Sync configuration per team
CREATE TABLE integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    external_source VARCHAR(50),
    enabled BOOLEAN DEFAULT FALSE,
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_all_projects BOOLEAN DEFAULT TRUE,
    selected_projects JSONB,
    field_mapping JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, external_source)
);

-- Indexes for performance
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_meetings_created_by ON meetings(created_by);
CREATE INDEX idx_meetings_team ON meetings(team_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_deadline ON action_items(deadline);
CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX idx_action_items_assignee ON action_items(assignee_id);
CREATE INDEX idx_action_items_assigned_by ON action_items(assigned_by);
CREATE INDEX idx_action_items_external ON action_items(external_source, external_id);
CREATE INDEX idx_action_items_sync_status ON action_items(sync_status);
CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_jira_connections_user ON jira_connections(user_id);
CREATE INDEX idx_trello_connections_user ON trello_connections(user_id);
CREATE INDEX idx_external_mappings_action_item ON external_task_mappings(action_item_id);
CREATE INDEX idx_external_mappings_source ON external_task_mappings(external_source, external_id);
CREATE INDEX idx_webhook_events_source ON webhook_events(external_source);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_integration_config_team ON integration_config(team_id);
`;

async function setup() {
  try {
    console.log('🚀 Setting up Acta database...');
    await pool.query(schema);
    console.log('✅ Acta database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setup();
