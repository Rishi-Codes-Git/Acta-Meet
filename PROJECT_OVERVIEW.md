# Acta Project Overview

Acta is a meeting management app that turns discussion notes or audio into structured Minutes of Meeting (MoM), decisions, and action items.

## What this project includes

- **Backend** (`backend/`): Express + TypeScript API, AI processing, exports, auth, integrations
- **Frontend** (`frontend/`): React web app for meetings, tasks, teams, dashboard
- **Mobile** (`mobile/`): React Native (Expo) app with login + dashboard + action items + teams
- **Infra**: PostgreSQL via `docker-compose.yml`

## Core features

- User auth (JWT) with optional 2FA (OTP by email)
- Create meetings with participants, agenda, and discussion points
- Audio upload + transcription
- AI-generated meeting summary, decisions, and action items
- Action item tracking (pending, in_progress, completed, blocked)
- Team management and team chat (Socket.io)
- Notifications (in-app + email)
- Export meeting output to **PDF** and **DOCX**
- Jira and Trello OAuth integrations + n8n automation hooks

## Tech stack (simple)

| Layer | Stack |
|---|---|
| Frontend (Web) | React 18, TypeScript, Vite, Tailwind, Zustand, React Hook Form, Zod, Axios |
| Backend (API) | Node.js, Express, TypeScript, pg, JWT, bcrypt, Socket.io |
| AI | Ollama (local LLM), Xenova Transformers (Whisper-based transcription) |
| Database | PostgreSQL 16, raw SQL schema + indexes, JSONB for MoM content |
| Docs/Export | PDFKit, docx |
| Mobile | Expo, React Native, React Navigation, Secure Store |
| Integrations | Jira OAuth, Trello OAuth, n8n webhooks, Nodemailer |

## Product flow (end-to-end)

1. User logs in and opens dashboard.
2. User creates a meeting (title, type, date, participants, objective).
3. User adds discussion text or uploads audio.
4. If audio is uploaded, backend transcribes it to text.
5. User triggers MoM generation.
6. Backend uses AI to create summary, decisions, and action items.
7. Action items are saved, mapped to assignees, and notifications are sent.
8. User reviews output and downloads PDF/DOCX.
9. Team members track action item status and collaborate via team chat.

## Architecture (simple)

```text
Web (React) + Mobile (Expo)
          |
   HTTP + WebSocket
          |
   Backend API (Express)
     |      |       |
     |      |       +--> External integrations (Jira, Trello, n8n, Email)
     |      +----------> AI services (Ollama + local transcription)
     +-----------------> PostgreSQL
```

## Main use cases

- Run a meeting and generate minutes automatically
- Extract tasks from discussion and assign owners
- Track pending/overdue/completed actions
- Export formal meeting documents for sharing
- Manage teams and run team-specific meeting workflows
- Sync tasks with Jira/Trello when integrations are connected

## Key backend route groups

- `/api/v1/auth`
- `/api/v1/meetings`
- `/api/v1/action-items`
- `/api/v1/dashboard`
- `/api/v1/transcribe`
- `/api/v1/teams`
- `/api/v1/notifications`
- `/api/v1/integrations`
- `/api/v1/users`
- `/api/v1/2fa`

## Notes / limitations

- AI generation expects local Ollama availability.
- File uploads are stored on local disk (`uploads/`).
- Some integrations are available but depend on external credentials and setup.
