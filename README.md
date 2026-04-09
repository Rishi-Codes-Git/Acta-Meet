# Acta - Automated Minutes of Meeting Generator

<div align="center">
  <img src="Acta logo.png" alt="Acta Logo" width="120"/>
  
  <h3>Meeting Intelligence Platform</h3>
  <p>AI-powered meeting minutes generation with automatic action item extraction and tracking</p>
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
</div>

---

## 🚀 Features

- **AI-Powered MoM Generation**: Automatically generate structured Minutes of Meeting from text or audio
- **Voice Transcription**: Upload audio recordings and get AI transcriptions via OpenAI Whisper
- **Smart Action Item Extraction**: AI extracts tasks, assigns owners, sets priorities and deadlines
- **Multi-Meeting Support**: Handle daily standups, client meetings, sprint planning, reviews, and more
- **Task Tracking**: Monitor action items with status updates and deadline tracking
- **Team Management**: Organize users into teams and track team-specific meetings
- **Real-time Notifications**: Get notified when tasks are assigned or completed
- **Document Export**: Generate professional PDF and Word documents
- **Multi-Platform**: Web, Desktop (Electron), and Mobile (Expo) apps

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** + Zod for validation
- **Lucide React** for icons

### Backend
- **Node.js** + Express + TypeScript
- **PostgreSQL** database
- **Ollama** (llama3.2, local LLM)
- **n8n** automation (Jira + Trello sync)
- **JWT** authentication
- **PDFKit** & **docx** for document generation

### Desktop & Mobile
- **Electron** for desktop app
- **Expo** for mobile app (React Native WebView wrapper)

---

## 📁 Project Structure

```
app/
├── backend/          # Node.js + Express API server
├── frontend/         # React web application
├── desktop/          # Electron desktop wrapper
├── mobile/           # Expo mobile wrapper
├── Acta logo.png     # App logo
└── SYSTEM_DESIGN.md  # Complete system architecture
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key

### 1. Clone Repository
```bash
git clone https://github.com/Rishi-Codes-Git/Acta-Meet.git
cd Acta-Meet
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your credentials:
#   DATABASE_URL=postgresql://...
#   OPENAI_API_KEY=sk-...
#   JWT_SECRET=your-secret-key

# Setup database
npm run db:setup

# Start backend
npm run dev
```
Backend runs on `http://localhost:3000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### 4. Desktop App (Optional)
```bash
cd desktop
npm install
npm run dev
```

### 5. Mobile App (Optional)
```bash
cd mobile
npm install
npx expo start
```

---

## 🎯 Usage

1. **Register/Login**: Create an account or sign in
2. **Create Meeting**: Click "New Meeting" and fill in details
3. **Add Discussion**: 
   - Type meeting notes manually, OR
   - Upload audio recording for AI transcription
4. **Generate MoM**: Click "Generate" to let AI process the discussion
5. **Review & Export**: View generated MoM and export as PDF/Word
6. **Track Tasks**: Monitor action items in your dashboard

---

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `meetings` - Meeting records
- `participants` - Meeting attendees
- `action_items` - Extracted tasks (linked to users)
- `decisions` - Meeting decisions
- `notifications` - In-app alerts

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for complete schema.

---

## 🔑 Key Features Explained

### Smart Assignee Matching
When AI extracts "John should update docs":
1. Searches meeting participants for "John"
2. If found, links to user account
3. Task appears in John's dashboard automatically

### Multi-Meeting Type Support
- Daily Standup
- Sprint Planning
- Client Meeting
- Sprint Review
- Retrospective
- Leadership Meeting

### Priority & Status Tracking
- **Priorities**: High, Medium, Low
- **Statuses**: Pending, In Progress, Completed

---

## 🎨 Color Palette

- **Primary Teal**: `#42A090`
- **Dark Slate**: `#1e293b` (sidebar)
- **Light Slate**: `#f8fafc` (background)

---

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Meetings
- `POST /api/v1/meetings` - Create meeting
- `GET /api/v1/meetings` - List all meetings
- `GET /api/v1/meetings/:id` - Get meeting details
- `POST /api/v1/meetings/:id/generate` - Generate MoM

### Action Items
- `GET /api/v1/action-items/my` - Get my tasks
- `PATCH /api/v1/action-items/:id/status` - Update task status

### Dashboard
- `GET /api/v1/dashboard/my` - Get personalized dashboard stats

---

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

**Rishi**  
GitHub: [@Rishi-Codes-Git](https://github.com/Rishi-Codes-Git)

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 and Whisper APIs
- React and Node.js communities
- All open-source contributors

---

<div align="center">
  <p>Built with ❤️ for better meeting management</p>
  <p><strong>Acta</strong> - Transform your meetings into actionable insights</p>
</div>
