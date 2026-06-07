# OrbitKeeper 🤖

> An AI Career Agent that helps students manage, improve, and succeed in internship and job applications.

Built for the **Google Cloud Agent Builder Hackathon** — MongoDB Partner Track.

[![MongoDB MCP](https://img.shields.io/badge/MongoDB-MCP%20Partner%20Track-green)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue)](https://ai.google.dev/)
[![MCP Protocol](https://img.shields.io/badge/Protocol-MCP%20Streamable%20HTTP-purple)](https://modelcontextprotocol.io/)

---

## What it does

Most students apply to dozens of internships and lose track of deadlines, resume versions, and interview prep. OrbitKeeper is an **AI agent** — not a chatbot — that actively performs tasks:

- **Analyzes** job descriptions and extracts structured data
- **Scores** your resume against requirements (0–100 match score)
- **Identifies** skill gaps and generates a prioritized action plan
- **Creates** personalized interview questions for each specific company
- **Monitors** deadlines and emails reminders 24h and 12h before they expire
- **Remembers** everything across sessions and answers questions about your progress

---

## MCP Integration (MongoDB Partner Track)

All AI agent data operations flow through a **real MCP server** built with `@modelcontextprotocol/sdk`:

```
Gemini Agent
    │
    │  JSON-RPC over HTTP  (POST /mcp)
    ▼
MCP Server  ─── 14 registered tools with JSON schemas
    │
    ▼
MongoDB Atlas  (applications, profiles, notification_logs)
```

**14 MCP tools registered:**

| Category | Tools |
|----------|-------|
| Generic MongoDB | `find_documents`, `insert_document`, `update_document`, `delete_document`, `aggregate`, `list_collections` |
| Career-specific | `store_ai_analysis`, `get_upcoming_deadlines`, `get_dashboard_stats`, `mark_reminder_sent` |
| Profile & Search | `get_profile`, `update_profile`, `search_applications` |
| Notifications | `log_notification` |

**Verify live at runtime:**
```
GET http://localhost:5000/api/mcp/tools
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI | Google Gemini 1.5 Flash |
| MCP Protocol | `@modelcontextprotocol/sdk` (Streamable HTTP) |
| Database | MongoDB Atlas via MCP |
| Email | Nodemailer + Gmail SMTP |
| Cron | node-cron (Deadline Monitor Agent) |

---

## Agent Architecture

| Agent | Trigger | MCP Tools Used |
|-------|---------|----------------|
| Job Analysis Agent | User pastes JD | — (Gemini only) |
| Resume Analysis Agent | Run Analysis button | — (Gemini only) |
| Career Planning Agent | Run Analysis button | — (Gemini only) |
| Interview Prep Agent | Interview Workspace | `find_documents`, `get_profile` |
| Career Memory Agent | AI Copilot chat | `find_documents`, `get_profile` |
| Deadline Monitor Agent | Cron every 30 min | `get_upcoming_deadlines`, `mark_reminder_sent`, `log_notification`, `get_profile` |
| Agent Controller | Run Analysis button | `find_documents`, `get_profile`, `store_ai_analysis` |

---

## Quick Start

See **[SETUP_AND_RUN.md](./SETUP_AND_RUN.md)** for the complete step-by-step guide.

```bash
# 1. Set up environment
copy server\.env.example server\.env
# Edit server/.env with your MongoDB URI and Gemini API key

# 2. Terminal 1 — Backend
cd server && npm run dev

# 3. Terminal 2 — Frontend
cd client && npm run dev

# 4. Open http://localhost:5173
```

---

## Project Structure

```
OrbitKeeper/
├── SETUP_AND_RUN.md          ← Complete run guide
├── client/                   ← React + Vite frontend
└── server/
    ├── mcp/
    │   ├── mcpServer.js      ← Real MCP server (14 tools, Streamable HTTP)
    │   ├── mcpClient.js      ← MCP client singleton used by all agents
    │   ├── toolHandlers.js   ← Tool implementations
    │   └── mongoMCP.js       ← Legacy REST path handlers
    ├── agents/               ← 6 AI agents (all use mcpClient)
    ├── models/               ← Mongoose schemas
    ├── routes/               ← Express + MCP routes
    ├── controllers/          ← Request handlers
    └── utils/                ← Gemini, emailer, DB
```
