# Acta - Meeting Intelligence Platform

> **Tagline:** *Transform your meetings into actionable insights*

---

## 🎯 What is Acta?

Acta is an **AI-powered Minutes of Meeting (MoM) generator** that automatically extracts action items, decisions, and summaries from meeting discussions — saving hours of manual documentation.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Generated MoM** | Paste meeting notes or transcript → Get structured minutes instantly |
| 📋 **Smart Action Items** | AI extracts tasks with assignees, priorities & deadlines |
| 👥 **Intelligent Assignee Matching** | Automatically links tasks to team members |
| 📄 **Export to PDF/Word** | Download professional documents with one click |
| 📊 **Dashboard Analytics** | Track meetings, pending tasks, completion rates |
| 🔔 **Notifications** | Get alerted when tasks are assigned or due |

---

## 🛠️ Tech Stack

```
Frontend:  React + TypeScript + Tailwind CSS + Vite
Backend:   Node.js + Express + PostgreSQL
AI:        Ollama (Local LLM)
Auth:      JWT-based authentication
Export:    PDFKit + docx library
```


## 🔄 How It Works

```
1. CREATE MEETING
   └─ Add title, participants, agenda

2. ADD DISCUSSION
   └─ Paste meeting transcript or notes

3. AI GENERATES MoM
   └─ Summary + Decisions + Action Items

4. REVIEW & EXPORT
   └─ Edit if needed → Download PDF/Word
```

---

## 🎨 Design Highlights

- **Brand Color:** `#42A090` (Teal)
- **Dark Sidebar:** `#1e293b` (Slate 900)
- **Modern UI:** Rounded corners, subtle shadows, smooth transitions
- **Typography:** Plus Jakarta Sans + Space Grotesk

---

## 📱 Platforms

| Platform | Technology |
|----------|------------|
| Web | React SPA |
| Desktop | Electron wrapper |
| Mobile | Expo (React Native) |

---

## 🚀 Unique Selling Points

1. **100% Local AI Option** — No data leaves your machine (Ollama)
2. **Smart Parsing** — Extracts deadlines from natural language ("by Friday")
3. **Multi-Meeting Types** — Standups, Sprint Planning, Client Calls, etc.
4. **Real-time Task Tracking** — Update status, filter by priority
5. **Team Collaboration** — Shared meetings, team dashboards

---

## 📈 User Flow Diagram

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Login      │ -> │  Dashboard   │ -> │ New Meeting  │
└──────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           v                    v
                    ┌──────────────┐    ┌──────────────┐
                    │  Meetings    │    │ Generate MoM │
                    │    List      │    └──────────────┘
                    └──────────────┘           │
                           │                   v
                           └────────>  ┌──────────────┐
                                       │ Meeting      │
                                       │ Details +    │
                                       │ Action Items │
                                       └──────────────┘
                                              │
                                              v
                                       ┌──────────────┐
                                       │ Export PDF/  │
                                       │ Word         │
                                       └──────────────┘
```

---

## 🏆 Problem It Solves

| Before Acta | After Acta |
|-------------|------------|
| Manual note-taking | Automated extraction |
| Missed action items | AI catches everything |
| Unassigned tasks | Smart assignee matching |
| Lost meeting context | Searchable history |
| No accountability | Task tracking + reminders |

---

## 📌 Poster Taglines (Pick One!)

- *"Your AI Meeting Secretary"*
- *"From Discussion to Action — Automatically"*
- *"Never Miss an Action Item Again"*
- *"Meetings Made Meaningful"*
- *"AI That Listens, Extracts, Delivers"*

---

## 🎯 Target Users

- **Product Teams** — Sprint planning, retrospectives
- **Sales Teams** — Client meeting follow-ups
- **Leadership** — Board meetings, strategic reviews
- **Remote Teams** — Async meeting documentation

---

**Built with ❤️ by Team Acta**

*GitHub: Rishi-Codes-Git/Acta-Meet*
