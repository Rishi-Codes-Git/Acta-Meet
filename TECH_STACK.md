# Acta - Technical Documentation

> Complete technical architecture and setup guide

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack](#backend-stack)
4. [Database Schema](#database-schema)
5. [AI Integration](#ai-integration)
6. [n8n Workflow Automation](#n8n-workflow-automation)
7. [Deployment Guide](#deployment-guide)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├──────────────┬──────────────────┬──────────────────────────────┤
│   Web App    │   Desktop App    │        Mobile App            │
│  (React+Vite)│    (Electron)    │     (Expo/React Native)      │
└──────┬───────┴────────┬─────────┴──────────────┬───────────────┘
       │                │                        │
       └────────────────┼────────────────────────┘
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                  │
│                  Node.js + Express                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │ Meetings │  │  Tasks   │  │  MoM Generator   │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │    Service       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ PostgreSQL  │ │   Ollama    │ │    n8n      │
│  Database   │ │  Local LLM  │ │  Workflows  │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🎨 Frontend Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI Library |
| **TypeScript** | 5.3.3 | Type Safety |
| **Vite** | 5.0.11 | Build Tool & Dev Server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS |

### State & Forms

| Package | Purpose |
|---------|---------|
| **Zustand** | Lightweight state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### UI Components

| Package | Purpose |
|---------|---------|
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |
| **clsx + tailwind-merge** | Conditional classes |

### Routing & HTTP

| Package | Purpose |
|---------|---------|
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client |

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── MainLayout.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── MeetingsPage.tsx
│   │   ├── MeetingDetailPage.tsx
│   │   ├── NewMeetingPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## ⚙️ Backend Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.x | Web Framework |
| **TypeScript** | 5.x | Type Safety |
| **PostgreSQL** | 16 | Database |

### Key Dependencies

| Package | Purpose |
|---------|---------|
| **pg** | PostgreSQL client |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |
| **cors** | Cross-origin requests |
| **uuid** | ID generation |

### Document Generation

| Package | Purpose |
|---------|---------|
| **pdfkit** | PDF generation |
| **docx** | Word document generation |

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── meetings.ts
│   │   ├── actionItems.ts
│   │   ├── dashboard.ts
│   │   └── notifications.ts
│   ├── services/
│   │   ├── momGenerator.ts
│   │   └── openai.ts (Ollama integration)
│   ├── middleware/
│   │   └── auth.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── setup.ts
│   ├── config.ts
│   └── index.ts
├── .env
└── package.json
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/meetings` | List all meetings |
| GET | `/api/v1/meetings/:id` | Get meeting details |
| POST | `/api/v1/meetings` | Create meeting |
| POST | `/api/v1/meetings/:id/generate` | Generate MoM |
| GET | `/api/v1/meetings/:id/download/pdf` | Download PDF |
| GET | `/api/v1/meetings/:id/download/docx` | Download Word |
| GET | `/api/v1/action-items/my` | Get my tasks |
| PATCH | `/api/v1/action-items/:id/status` | Update task status |
| GET | `/api/v1/dashboard/my` | Dashboard data |

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  objective TEXT,
  meeting_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(255),
  created_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50),
  attended BOOLEAN DEFAULT true
);

-- Discussion Points
CREATE TABLE discussion_points (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker VARCHAR(255),
  summary TEXT
);

-- Action Items
CREATE TABLE action_items (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  assignee_id UUID REFERENCES users(id),
  assignee_name VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  deadline TIMESTAMP
);

-- Decisions
CREATE TABLE decisions (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  decided_by VARCHAR(255)
);

-- MoM Documents
CREATE TABLE mom_documents (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  pdf_path VARCHAR(500),
  docx_path VARCHAR(500),
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 AI Integration

### Ollama (Local LLM)

Acta uses **Ollama** for 100% local AI processing — no data leaves your machine.

#### Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model
ollama pull llama3.2

# Start Ollama server
ollama serve
```

#### Configuration

```env
# backend/.env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

#### AI Functions

| Function | Purpose |
|----------|---------|
| `summarizeDiscussion()` | Generate meeting summary |
| `extractMeetingInsights()` | Extract decisions & action items |

#### Response Format

```json
{
  "summary": "Executive summary of the meeting...",
  "decisions": [
    { "decision": "...", "decided_by": "John" }
  ],
  "action_items": [
    {
      "task": "Review AWS costs",
      "assignee": "testuser2",
      "deadline": "2026-04-10",
      "priority": "high"
    }
  ]
}
```

---

## 🔄 n8n Workflow Automation

### What is n8n?

n8n is a workflow automation platform that connects Acta with external services.

### Setup

#### 1. Install n8n (Docker)

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

#### 2. Access n8n

Open `http://localhost:5678` in your browser.

### Acta + n8n Workflows

#### Workflow 1: Email Notifications

```
Trigger: New Action Item Created
  ↓
HTTP Request: Fetch assignee email
  ↓
Send Email: Notify assignee
```

#### Workflow 2: Slack Integration

```
Trigger: MoM Generated
  ↓
Format Message: Create Slack block
  ↓
Slack: Post to #meetings channel
```

#### Workflow 3: Calendar Sync

```
Trigger: New Meeting Created
  ↓
Google Calendar: Create event
  ↓
Invite: Send to participants
```

#### Workflow 4: Deadline Reminders

```
Schedule: Daily at 9 AM
  ↓
HTTP Request: Get tasks due today
  ↓
Filter: Pending tasks only
  ↓
Send Reminder: Email/Slack
```

### n8n Webhook Endpoints

Add these to your backend to trigger n8n:

```typescript
// After MoM generation
await axios.post('http://localhost:5678/webhook/mom-generated', {
  meetingId,
  title,
  summary,
  actionItems
});

// After task creation
await axios.post('http://localhost:5678/webhook/task-created', {
  taskId,
  assignee,
  deadline
});
```

### Environment Variables for n8n

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secret
```

---

## 🚀 Deployment Guide

### Development

```bash
# Start PostgreSQL
docker-compose up -d

# Backend
cd backend
npm install
npm run dev  # Port 3000

# Frontend
cd frontend
npm install
npm run dev  # Port 5173

# Ollama
ollama serve  # Port 11434

# n8n (optional)
docker run -d -p 5678:5678 n8nio/n8n
```

### Production

#### Docker Compose (Full Stack)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: acta_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: acta_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://acta_user:${DB_PASSWORD}@postgres:5432/acta_db
      JWT_SECRET: ${JWT_SECRET}
      OLLAMA_URL: http://ollama:11434
    depends_on:
      - postgres
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  ollama:
    image: ollama/ollama
    volumes:
      - ollama_data:/root/.ollama

  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  postgres_data:
  ollama_data:
  n8n_data:
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://mom_user:password@localhost:5432/mom_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# n8n (optional)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

---

## 📊 Performance Considerations

| Area | Optimization |
|------|--------------|
| Database | Indexes on meeting_id, user_id, status |
| API | Pagination on list endpoints |
| AI | Async processing with job queue |
| Frontend | Code splitting, lazy loading |
| Caching | Redis for session & frequently accessed data |

---

## 🔗 Quick Links

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`
- **Ollama:** `http://localhost:11434`
- **n8n Dashboard:** `http://localhost:5678`
- **PostgreSQL:** `localhost:5432`

---

**Version:** 1.0.0  
**Last Updated:** April 2026
