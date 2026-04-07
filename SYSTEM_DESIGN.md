# Automated Minutes of Meeting (MoM) Generation System

## Final System Design Document

---

## Tech Stack (Final)

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL |
| **AI** | OpenAI API (GPT-4o-mini + Whisper) |
| **Document Generation** | PDFKit (PDF) + docx (Word) |
| **Automation** | n8n (self-hosted) |
| **Email** | Gmail SMTP / n8n |

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   Web App (React)   │  Mobile (React Native) │   Desktop (Electron)         │
└─────────┬───────────┴──────────┬──────────┴─────────────┬───────────────────┘
          │                      │                        │
          ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Express.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth  │  Meetings  │  MoM Generation  │  Action Items  │  Dashboard        │
└─────────────────────────────────────────────────────────────────────────────┘
          │                      │                        │
          ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENAI API                                         │
├───────────────────────────────┬─────────────────────────────────────────────┤
│  Whisper (Speech-to-Text)     │  GPT-4o-mini (Summarization + Extraction)   │
└───────────────────────────────┴─────────────────────────────────────────────┘
          │                      │                        │
          ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA & INTEGRATION LAYER                           │
├─────────────────┬─────────────────────┬─────────────────────────────────────┤
│   PostgreSQL    │   n8n Automation    │   External APIs (Jira, Trello)      │
└─────────────────┴─────────────────────┴─────────────────────────────────────┘
```

---

## 2. Data Flow

```
Step 1: User Input
─────────────────
Manager creates meeting with participants (linked to user accounts)
Adds discussion points OR uploads audio
         │
         ▼
Step 2: Participant Linking
───────────────────────────
System matches participant emails → user accounts
         │
         ▼
Step 3: AI Processing
─────────────────────
┌─────────────────────────────────────────────────┐
│ IF audio present:                               │
│   └─ OpenAI Whisper → Transcription             │
│                                                 │
│ Text Processing:                                │
│   ├─ GPT-4o-mini → Discussion Summary           │
│   ├─ GPT-4o-mini → Action Items + Owners        │
│   └─ GPT-4o-mini → Key Decisions                │
└─────────────────────────────────────────────────┘
         │
         ▼
Step 4: Smart Assignment
────────────────────────
AI extracts: "John should fix the bug"
System matches "John" → participant list → user account
Action item saved with assignee_id (user reference)
         │
         ▼
Step 5: Document Generation
───────────────────────────
PDFKit generates PDF, docx generates Word
         │
         ▼
Step 6: Storage & Notifications
───────────────────────────────
Save MoM, action items to PostgreSQL
Send in-app notifications to all assignees
         │
         ▼
Step 7: User-Specific Views
───────────────────────────
Y logs in → sees only Y's tasks in "My Tasks"
Z logs in → sees only Z's tasks in "My Tasks"
Manager sees all tasks + who they assigned to
```

### Assignment Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSIGNEE MATCHING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AI extracts: "Sarah should review the docs"                    │
│                      │                                           │
│                      ▼                                           │
│  Step 1: Search meeting participants                            │
│          WHERE name ILIKE '%sarah%'                             │
│                      │                                           │
│          ┌──── Found? ────┐                                     │
│          │                │                                      │
│         YES              NO                                      │
│          │                │                                      │
│          ▼                ▼                                      │
│    Use participant    Step 2: Search all users                  │
│    user_id            WHERE name ILIKE '%sarah%'                │
│                              │                                   │
│                    ┌── Found? ──┐                               │
│                    │            │                                │
│                   YES          NO                                │
│                    │            │                                │
│                    ▼            ▼                                │
│              Use user_id   Save name only                       │
│                            (no user_id)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features (Prioritized)

### Must-Have (MVP) - Day 1-2
| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Meeting Input Form | Title, type, date, participants, agenda, discussion |
| P0 | Multi-Format Support | Standup, client, sprint, retro, leadership |
| P0 | AI Summarization | GPT-4o-mini summarizes discussions |
| P0 | Action Item Extraction | Auto-extract tasks, owners, deadlines, priority |
| P0 | MoM Document Generation | PDF/Word with professional formatting |
| P0 | Dashboard | View all meetings, search, filter |
| P0 | Action Item Tracker | Status: Pending → In Progress → Completed |

### Should-Have - Day 2-3
| Priority | Feature | Description |
|----------|---------|-------------|
| P1 | Voice-to-Text | Upload audio → Whisper transcription |
| P1 | Email Notifications | Send MoM via n8n + Gmail |
| P1 | Meeting Templates | Pre-configured per meeting type |

### Nice-to-Have - Day 3+
| Priority | Feature | Description |
|----------|---------|-------------|
| P2 | Jira/Trello Integration | Auto-create tasks |
| P2 | Analytics Dashboard | Completion rates, overdue tracking |
| P2 | Export Options | Markdown, Confluence |

---

## 4. Module Breakdown

### 4.1 Input Module
```
┌─────────────────────────────────────────────┐
│              INPUT MODULE                    │
├─────────────────────────────────────────────┤
│ • Meeting Form                               │
│   - Title, Type (dropdown)                   │
│   - Date/Time picker                         │
│   - Participants (multi-input)               │
│   - Agenda Items (dynamic list)              │
│   - Discussion Points (rich text)            │
│                                              │
│ • Audio Upload (optional)                    │
│   - Drag & drop audio file                   │
│   - Supported: mp3, wav, m4a, webm           │
│                                              │
│ • Meeting Types                              │
│   - Daily Standup                            │
│   - Client Meeting                           │
│   - Sprint Planning                          │
│   - Sprint Review                            │
│   - Retrospective                            │
│   - Leadership Meeting                       │
│   - General                                  │
└─────────────────────────────────────────────┘
```

### 4.2 AI Processing Module
```
┌─────────────────────────────────────────────┐
│         AI PROCESSING MODULE                 │
├─────────────────────────────────────────────┤
│                                              │
│ 1. Transcription (if audio)                  │
│    └─ OpenAI Whisper API                     │
│                                              │
│ 2. Discussion Summarization                  │
│    └─ GPT-4o-mini                            │
│    └─ Prompt: Concise meeting summary        │
│                                              │
│ 3. Action Item Extraction                    │
│    └─ GPT-4o-mini with JSON mode             │
│    └─ Extract: task, owner, deadline, priority│
│                                              │
│ 4. Decision Extraction                       │
│    └─ GPT-4o-mini                            │
│    └─ Key decisions made in meeting          │
│                                              │
└─────────────────────────────────────────────┘
```

### 4.3 Output Module
```
┌─────────────────────────────────────────────┐
│            OUTPUT MODULE                     │
├─────────────────────────────────────────────┤
│ • PDF Generator (PDFKit)                     │
│   - Company header/footer                    │
│   - Formatted sections                       │
│   - Action items table                       │
│                                              │
│ • Word Generator (docx npm package)          │
│   - Editable document                        │
│   - Same structure as PDF                    │
│                                              │
│ • Email Dispatcher (via n8n)                 │
│   - Attach PDF                               │
│   - Send to all participants                 │
└─────────────────────────────────────────────┘
```

---

## 5. API Design

### Base URL: `/api/v1`

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register user |
| `/auth/login` | POST | Login, returns JWT |
| `/auth/me` | GET | Get current user |

### Meetings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/meetings` | GET | List meetings (paginated, filterable) |
| `/meetings` | POST | Create meeting |
| `/meetings/:id` | GET | Get meeting details |
| `/meetings/:id` | PUT | Update meeting |
| `/meetings/:id` | DELETE | Delete meeting |
| `/meetings/:id/generate` | POST | Generate MoM (triggers AI) |
| `/meetings/:id/mom` | GET | Get generated MoM data |
| `/meetings/:id/download/pdf` | GET | Download PDF |
| `/meetings/:id/download/docx` | GET | Download Word |

### Action Items
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/action-items` | GET | List all action items |
| `/action-items/:id` | PUT | Update action item |
| `/action-items/:id/status` | PATCH | Update status only |
| `/meetings/:id/action-items` | GET | Action items for a meeting |

### Transcription
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Upload audio, get transcription |

### Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/stats` | GET | Meeting & action item stats |
| `/dashboard/upcoming` | GET | Upcoming deadlines |
| `/dashboard/overdue` | GET | Overdue action items |

---

## 6. Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Types
CREATE TYPE meeting_type AS ENUM (
    'daily_standup', 'client_meeting', 'sprint_planning',
    'sprint_review', 'retrospective', 'leadership', 'general'
);

-- Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    type meeting_type NOT NULL,
    objective TEXT,
    meeting_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    location VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'attendee'
);

-- Agenda Items
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

-- Discussion Points
CREATE TABLE discussion_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    summary TEXT,
    speaker VARCHAR(255)
);

-- Decisions
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    decided_by VARCHAR(255)
);

-- Priority & Status Enums
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

-- Action Items
CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee VARCHAR(255),
    priority priority_level DEFAULT 'medium',
    status action_status DEFAULT 'pending',
    deadline DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MoM Documents
CREATE TABLE mom_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    pdf_path VARCHAR(500),
    docx_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Transcriptions
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    audio_path VARCHAR(500),
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_deadline ON action_items(deadline);
```

---

## 7. OpenAI Integration

### Prompts

#### Summarization Prompt
```javascript
const SUMMARIZE_PROMPT = `
You are a professional meeting summarizer. Create a concise summary of the following meeting discussion.

Meeting Type: ${meetingType}
Discussion:
${discussionText}

Provide:
1. A 2-3 sentence executive summary
2. Key points discussed (bullet points)
3. Keep it professional and actionable
`;
```

#### Action Item Extraction Prompt
```javascript
const ACTION_EXTRACTION_PROMPT = `
Extract action items from this meeting discussion. Return JSON only.

Discussion:
${discussionText}

Return this exact JSON structure:
{
  "actionItems": [
    {
      "task": "Clear task description",
      "assignee": "Person name or 'Unassigned'",
      "deadline": "YYYY-MM-DD or null",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Infer priority from context (urgent/critical/ASAP = high)
- Infer deadline from phrases like "by Friday", "next week"
- If no clear assignee, use "Unassigned"
`;
```

#### Decision Extraction Prompt
```javascript
const DECISION_PROMPT = `
Extract key decisions made in this meeting. Return JSON only.

Discussion:
${discussionText}

Return:
{
  "decisions": [
    {
      "decision": "What was decided",
      "decidedBy": "Person or 'Team'"
    }
  ]
}
`;
```

---

## 8. Project Structure

```
app/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry
│   │   ├── config/
│   │   │   └── index.ts             # Environment config
│   │   ├── db/
│   │   │   ├── index.ts             # PostgreSQL connection
│   │   │   └── schema.sql           # Database schema
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── meetings.ts
│   │   │   ├── actionItems.ts
│   │   │   └── dashboard.ts
│   │   ├── services/
│   │   │   ├── openai.ts            # OpenAI API calls
│   │   │   ├── transcription.ts     # Whisper integration
│   │   │   ├── momGenerator.ts      # AI processing pipeline
│   │   │   └── documentGenerator.ts # PDF/Word generation
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT middleware
│   │   └── types/
│   │       └── index.ts             # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── MeetingForm.tsx
│   │   │   ├── MeetingList.tsx
│   │   │   ├── MoMViewer.tsx
│   │   │   ├── ActionItemTracker.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── NewMeeting.tsx
│   │   │   ├── MeetingDetail.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── store/
│   │   │   └── index.ts             # Zustand store
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── mobile/                          # React Native (optional)
│
├── desktop/                         # Electron wrapper (optional)
│
├── n8n/
│   └── workflows/
│       ├── email-notification.json
│       └── jira-integration.json
│
├── docker-compose.yml
└── SYSTEM_DESIGN.md                 # This file
```

---

## 9. n8n Integration

### What n8n Handles (External)
- Email notifications to participants
- Jira/Trello task creation
- Slack notifications
- Scheduled deadline reminders

### What Backend Handles (Internal)
- All CRUD operations
- AI processing (OpenAI calls)
- Document generation
- Business logic

### Webhook Flow
```
Backend generates MoM
        │
        ▼
POST to n8n webhook: /webhook/mom-generated
        │
        ▼
n8n workflow:
  ├─ Fetch participant emails
  ├─ Format email content
  ├─ Attach PDF
  └─ Send via Gmail SMTP
```

---

## 10. Implementation Timeline

### Day 1: Foundation
- [ ] Initialize Node.js + Express backend
- [ ] Set up PostgreSQL database + schema
- [ ] Create React frontend with Vite
- [ ] Implement Meeting CRUD APIs
- [ ] Build meeting input form UI

### Day 2: AI + Core Features
- [ ] Integrate OpenAI API (summarization)
- [ ] Implement action item extraction
- [ ] Build MoM document generator (PDF)
- [ ] Create dashboard with meeting list
- [ ] Add action item tracker UI

### Day 3: Polish + Integrations
- [ ] Add Whisper transcription (audio upload)
- [ ] Set up n8n email workflow
- [ ] UI polish and responsive design
- [ ] Testing and bug fixes
- [ ] Demo preparation

---

## 11. Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mom_db

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# n8n Webhook
N8N_WEBHOOK_URL=http://localhost:5678/webhook/mom-generated

# File Storage
UPLOAD_DIR=./uploads
```

---

## 12. Quick Start

```bash
# 1. Start PostgreSQL
docker run -d --name mom-postgres \
  -e POSTGRES_USER=mom_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mom_db \
  -p 5432:5432 postgres:16

# 2. Backend
cd backend
npm install
npm run dev

# 3. Frontend
cd frontend
npm install
npm run dev

# 4. n8n (optional)
docker run -d --name n8n -p 5678:5678 n8nio/n8n
```

---

## 13. Demo Script (5 Minutes)

**Minute 1**: Problem + Solution intro
**Minute 2**: Create meeting, input discussion
**Minute 3**: Generate MoM, show AI processing, display PDF
**Minute 4**: Show extracted action items, update status
**Minute 5**: Dashboard, email notification, Jira ticket

---

*Simple stack. Maximum impact. Focus on execution.*
