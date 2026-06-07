# OrbitKeeper — Setup & Run Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| MongoDB Atlas account | free tier OK | atlas.mongodb.com |
| Google Gemini API key | free tier OK | aistudio.google.com |
| Gmail account | for email reminders | optional for MVP |

---

## Step 1 — Clone & Install

Dependencies are already installed. If you ever need to reinstall:

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## Step 2 — Configure Environment

Create the file `server/.env` (copy from `server/.env.example`):

```bash
# On Windows CMD:
copy server\.env.example server\.env

# On PowerShell:
Copy-Item server\.env.example server\.env
```

Then open `server/.env` and fill in:

```env
PORT=5000
NODE_ENV=development

# ── MongoDB Atlas ──────────────────────────────────────────────────────────────
# 1. Go to https://cloud.mongodb.com
# 2. Create a free cluster (M0)
# 3. Click "Connect" → "Drivers" → copy the connection string
# 4. Replace <username> and <password> with your DB user credentials
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/orbitkeeper?retryWrites=true&w=majority

# ── Google Gemini ──────────────────────────────────────────────────────────────
# 1. Go to https://aistudio.google.com/app/apikey
# 2. Click "Create API Key"
# 3. Copy it here
GEMINI_API_KEY=AIzaSy_your_key_here

# ── Gmail (for deadline reminder emails) ──────────────────────────────────────
# 1. Go to https://myaccount.google.com/security
# 2. Enable 2-Step Verification
# 3. Search "App passwords" → create one for "Mail"
# 4. Use that 16-char password below (NOT your Gmail login password)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx

# ── Frontend URL ───────────────────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173
```

---

## Step 3 — Run the App

You need **two terminals open at the same time**.

### Terminal 1 — Backend (API + MCP Server)

```bash
cd server
npm run dev
```

You should see:

```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 OrbitKeeper API  →  http://localhost:5000
🔧 MCP Server endpoint     →  POST http://localhost:5000/mcp
📋 MCP Tool manifest       →  GET  http://localhost:5000/api/mcp/tools
[MCPClient] ✅ Connected to MCP server at http://localhost:5000/mcp
⏰ Deadline Monitor Agent started (via MCP)
```

### Terminal 2 — Frontend (React)

```bash
cd client
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Open the app

Go to: **http://localhost:5173**

---

## Step 4 — Verify MCP Integration (for Judges)

These endpoints prove real MCP protocol usage:

### 1. View all 14 registered MCP tools

```
GET http://localhost:5000/api/mcp/tools
```

Returns the live tool manifest — tool names, descriptions, and JSON schemas.

### 2. Call an MCP tool directly (raw protocol)

```bash
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_collections",
      "arguments": {}
    }
  }'
```

### 3. Test health check

```
GET http://localhost:5000/api/health
```

---

## Step 5 — Use the App

### Full workflow:

1. **Profile page** — Upload your resume (PDF or TXT). AI extracts your skills automatically.

2. **Applications → Add Application** — Paste a job description. Click **AI Analyze** to preview the role.

3. **Save** the application, then open it.

4. **Run AI Analysis** button — This triggers all 5 agents:
   - Job Analysis Agent → extracts role info
   - Resume Analysis Agent → computes match score
   - Career Planning Agent → generates action plan
   - Interview Prep Agent → creates personalized questions
   - MCP `store_ai_analysis` tool → saves everything to MongoDB

5. **Interview Workspace** — Review and check off questions as you prepare.

6. **AI Copilot** — Ask questions like:
   - "What should I revise for tomorrow's interview?"
   - "Which application has the highest match score?"
   - "What skills am I missing most?"

---

## MCP Architecture (for Hackathon Judges)

```
AI Agents (Gemini)
     │
     │  calls via MCP protocol (HTTP POST /mcp)
     ▼
┌─────────────────────────────────────┐
│     MCP Server (mcpServer.js)       │
│  14 tools registered with schemas   │
│  transport: StreamableHTTP          │
└──────────────┬──────────────────────┘
               │
               ▼
        toolHandlers.js
               │
               ▼
          MongoDB Atlas
   ┌────────────────────────┐
   │  applications          │
   │  notification_logs     │
   │  profiles              │
   └────────────────────────┘
```

### MCP Tools

| Tool | Purpose |
|------|---------|
| `find_documents` | Query any collection with filters |
| `insert_document` | Create a new document |
| `update_document` | Update by ID |
| `delete_document` | Delete by ID |
| `aggregate` | Run aggregation pipeline |
| `list_collections` | List all DB collections |
| `store_ai_analysis` | Save full AI analysis to an application |
| `get_upcoming_deadlines` | Find apps with deadlines in N hours |
| `get_dashboard_stats` | Aggregated dashboard metrics |
| `mark_reminder_sent` | Prevent duplicate notifications |
| `log_notification` | Audit trail for emails sent |
| `get_profile` | Retrieve student profile |
| `update_profile` | Save profile changes |
| `search_applications` | Full-text search |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoServerError: bad auth` | Check MONGODB_URI username/password |
| `MCPClient not connected` | Backend must start before agents can connect. Wait for `✅ Connected` log |
| `GEMINI_API_KEY invalid` | Get a fresh key from aistudio.google.com |
| `Error: Could not extract text from PDF` | Try a text-based PDF (not scanned image) |
| Frontend shows blank page | Make sure `npm run dev` is running in the `client` folder |
| Port 5000 already in use | Change `PORT=5001` in `.env` |

---

## Project Structure

```
OrbitKeeper/
├── server/
│   ├── agents/
│   │   ├── jobAnalysisAgent.js       ← Gemini: parse job descriptions
│   │   ├── resumeAnalysisAgent.js    ← Gemini: match score + skill gaps
│   │   ├── careerPlanningAgent.js    ← Gemini: action plan generation
│   │   ├── interviewPrepAgent.js     ← Gemini: personalized questions
│   │   ├── careerMemoryAgent.js      ← MCP + Gemini: memory retrieval
│   │   └── deadlineMonitor.js        ← MCP: autonomous cron agent
│   ├── mcp/
│   │   ├── mcpServer.js              ← Real MCP server (14 tools)
│   │   ├── mcpClient.js              ← MCP client singleton for agents
│   │   ├── toolHandlers.js           ← Tool implementations (MongoDB ops)
│   │   └── mongoMCP.js               ← Legacy layer (REST API paths)
│   ├── models/                       ← Mongoose schemas
│   ├── routes/                       ← Express routes
│   ├── controllers/                  ← Request handlers
│   └── utils/                        ← Gemini, emailer, DB helpers
└── client/
    └── src/
        ├── pages/                    ← Dashboard, Tracker, Detail, etc.
        └── components/               ← Reusable UI components
```
