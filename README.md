# OrbitKeeper 🤖

> An AI Career Agent that helps students manage, improve, and succeed in internship and job applications.

**Built using the code-first approach of Google Cloud Agent Builder via the Vertex AI SDK for fine-grained agent orchestration.**

Submitted to **Google Cloud Agent Builder Hackathon** — MongoDB Partner Track.

[![MongoDB MCP](https://img.shields.io/badge/MongoDB-MCP%20Partner%20Track-green)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5--flash-blue)](https://ai.google.dev/)
[![MCP Protocol](https://img.shields.io/badge/Protocol-MCP%20Official%20SDK-purple)](https://modelcontextprotocol.io/)
[![Vertex AI](https://img.shields.io/badge/Platform-Google%20Cloud%20Vertex%20AI-orange)](https://cloud.google.com/vertex-ai)

---

## 🎯 What it does

Most students apply to dozens of internships and lose track of deadlines, resume versions, and interview prep. OrbitKeeper is an **AI agent** — not a chatbot — that actively performs tasks:

- **Analyzes** job descriptions and extracts structured data
- **Scores** your resume against requirements (0–100 match score)
- **Identifies** skill gaps and generates a prioritized action plan
- **Creates** personalized interview questions for each specific company
- **Monitors** deadlines autonomously and emails reminders to your Gmail
- **Remembers** everything across sessions and answers questions about your progress

---

## 🏗️ Architecture: Agent Builder + MCP + MongoDB

OrbitKeeper uses **Google Cloud Agent Builder** (code-first approach via Vertex AI SDK) to orchestrate 6 specialized AI agents powered by **Gemini 2.5-flash**.

### The MCP "Superpower"

**What gives OrbitKeeper its superpowers:** Our agents use the official **`@modelcontextprotocol/sdk`** to grant Gemini **direct, secure data operations** over **MongoDB Atlas**.

Instead of writing custom database code for each agent, we built a production-grade MCP server that exposes **14 MongoDB operations as JSON-RPC tools**. Gemini can now:

- Query applications with filters and sorting
- Store AI analysis results atomically
- Retrieve user profiles and career history
- Mark notifications sent to prevent duplicates
- Aggregate dashboard statistics

**All through a standardized protocol.** This is the MCP integration for the **MongoDB Partner Track**.

```
┌─────────────────────────────────────────────────────────────────┐
│  Google Cloud Agent Builder (Vertex AI SDK)                     │
│  ↓ Gemini 2.5-flash orchestrates 6 specialized agents          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ JSON-RPC over HTTP (MCP Protocol)
                       │ POST http://localhost:5000/mcp
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  MCP Server (@modelcontextprotocol/sdk)                         │
│  ↓ 14 registered tools with Zod schemas                         │
│  ↓ Streamable HTTP transport                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ Secure tool handlers
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB Atlas                                                   │
│  • applications (internship tracker)                            │
│  • profiles (user career data)                                  │
│  • notification_logs (email audit trail)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 MCP Integration Details (MongoDB Partner Track)

### MCP Server Implementation

**Built with official SDK:** `@modelcontextprotocol/sdk` v1.29.0

**Transport:** Streamable HTTP (`StreamableHTTPServerTransport`)

**Protocol:** JSON-RPC 2.0 with typed tool schemas (Zod validation)

**Endpoint:** `POST /mcp` (stateless, handles concurrent requests)

### 14 MongoDB Tools Exposed via MCP

| Category | Tool Name | What Gemini Can Do |
|----------|-----------|-------------------|
| **Generic CRUD** | `find_documents` | Query any collection with MongoDB filters, sorting, limits |
| | `insert_document` | Create new documents (applications, profiles) |
| | `update_document` | Update existing documents by ObjectId |
| | `delete_document` | Remove documents by ObjectId |
| | `aggregate` | Run MongoDB aggregation pipelines |
| | `list_collections` | Discover available collections |
| **Career-Specific** | `store_ai_analysis` | Atomically save match scores, skill gaps, action plans, interview questions |
| | `get_upcoming_deadlines` | Find applications with deadlines in next N hours |
| | `get_dashboard_stats` | Aggregate metrics: total apps, by-status counts, avg match score |
| | `mark_reminder_sent` | Prevent duplicate 24h/12h deadline notifications |
| **Profile & Search** | `get_profile` | Retrieve user's skills, resume, career goals |
| | `update_profile` | Save profile changes |
| | `search_applications` | Full-text search across company, role, notes, JD |
| **Notifications** | `log_notification` | Audit trail for sent emails (status, timestamp, error logs) |

**Live Tool Manifest:**
```bash
GET http://localhost:5000/api/mcp/tools
```

Returns JSON with all 14 tools, descriptions, and input schemas.

---

## 🤖 Agent Architecture (6 Specialized Agents)

All agents use Gemini 2.5-flash via **Google Cloud Vertex AI** (Agent Builder platform) and communicate with MongoDB **exclusively through MCP tools** — no direct database imports.

| Agent | Trigger | MCP Tools Used | Purpose |
|-------|---------|----------------|---------|
| **Job Analysis Agent** | User pastes job description | None (pure LLM) | Extract company, role, required skills, qualifications from unstructured JD text |
| **Resume Analysis Agent** | "Run Analysis" button | None (pure LLM) | Parse resume, compute 0-100 match score, identify strength/weakness areas |
| **Career Planning Agent** | "Run Analysis" button | None (pure LLM) | Generate prioritized action plan (tasks, resources, timelines) to close skill gaps |
| **Interview Prep Agent** | Interview Workspace | `find_documents`, `get_profile` | Create personalized interview questions based on JD + user background |
| **Career Memory Agent** | AI Copilot chat | `find_documents`, `get_profile` | Answer questions about applications, match scores, skills using career history |
| **Deadline Monitor Agent** | Cron (every 30 min) | `get_upcoming_deadlines`, `mark_reminder_sent`, `log_notification` | Autonomous background agent: sends 24h/12h email reminders via Gmail to user's authenticated email |
| **Agent Controller** | "Run Analysis" button | `find_documents`, `get_profile`, `store_ai_analysis` | Orchestrates Job + Resume + Career Planning agents, stores results atomically via MCP |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Platform** | Google Cloud Vertex AI | Agent Builder (code-first via SDK) |
| **LLM** | Gemini 2.5-flash | Agent orchestration and reasoning |
| **MCP SDK** | `@modelcontextprotocol/sdk` v1.29.0 | Official protocol implementation |
| **MCP Transport** | Streamable HTTP | JSON-RPC 2.0 over POST /mcp |
| **Database** | MongoDB Atlas | Partner track integration via MCP |
| **Auth** | Firebase Authentication | Google OAuth 2.0, secure token verification |
| **Frontend** | React 18 + Vite + Tailwind CSS | Modern SPA with hot reload |
| **Backend** | Node.js + Express | REST API + MCP server |
| **Cron** | node-cron | Autonomous deadline monitoring agent |
| **Email** | Nodemailer + Gmail | Deadline reminders to user's Gmail |

---

## 🚀 Key Features

### For Students:
- ✅ **Smart Resume Analysis**: Upload PDF/TXT, get AI-powered skill extraction
- ✅ **Match Score (0-100)**: See how well you fit each role
- ✅ **Skill Gap Detection**: Know exactly what to learn
- ✅ **Action Plans**: Prioritized tasks with resources and timelines
- ✅ **Interview Prep**: Personalized questions for each company
- ✅ **Deadline Tracking**: Never miss an application deadline
- ✅ **AI Copilot**: Ask about your progress, get insights
- ✅ **Multi-Device**: Google Sign-In works everywhere

### For Developers:
- ✅ **Real MCP Implementation**: Not a REST API wrapper, actual JSON-RPC protocol
- ✅ **Stateless MCP Server**: Handles concurrent requests
- ✅ **Zod Schema Validation**: Type-safe tool definitions
- ✅ **Agent Isolation**: Each agent uses `mcpClient` singleton, no direct DB imports
- ✅ **Firebase Admin SDK**: Secure token verification on all API routes
- ✅ **User Isolation**: Each user's data is completely separate
- ✅ **Production-Ready**: No hardcoded secrets, proper `.gitignore`, environment variables

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
