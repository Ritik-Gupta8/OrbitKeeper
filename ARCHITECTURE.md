# 🏗️ OrbitKeeper Architecture

**Technical Deep Dive & Future Roadmap**

> Built on **Google Agent Platform** (Google Cloud's enterprise agent stack, formerly Vertex AI) with **Gemini 3.5 Flash** and a custom **MongoDB MCP server**.

---

## Table of Contents

1. [Google Agent Platform Integration](#google-agent-platform-integration)
2. [System Overview](#system-overview)
3. [Architecture Layers](#architecture-layers)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [MCP Integration](#mcp-integration)
6. [AI Agent System](#ai-agent-system)
7. [Authentication & Security](#authentication--security)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Deployment Architecture](#deployment-architecture)
11. [Performance & Scalability](#performance--scalability)
12. [Future Enhancements](#future-enhancements)
13. [Known Limitations](#known-limitations)
14. [MongoDB IP Whitelist Setup](#mongodb-ip-whitelist-setup)

---

## Google Agent Platform Integration

OrbitKeeper is built on **Google Agent Platform** — Google Cloud's enterprise platform for building and running AI agents (the platform formerly known as Vertex AI). Every piece of reasoning in OrbitKeeper is powered by **Gemini 3.5 Flash**, served through the Agent Platform's Vertex AI inference layer and orchestrated as a coordinated multi-agent system.

**Mapping OrbitKeeper to the Agent Platform building blocks:**

| Agent Platform Capability | OrbitKeeper Implementation |
|---------------------------|----------------------------|
| **Models** (Gemini) | Gemini 3.5 Flash for all reasoning, planning, and generation |
| **Agents** (multi-agent orchestration) | 6 specialized agents coordinated through a controller pipeline |
| **MCP Servers** (external capabilities) | A custom MongoDB MCP server exposing 14 tools |
| **Memory** (long-term context) | Persistent career memory stored in MongoDB Atlas |
| **Tools** (function calling) | Standardized, schema-validated tool calls via the official MCP SDK |

The agents do more than chat — they **reason, plan, invoke tools, and execute tasks** under user oversight. This agentic loop (perceive → reason → act via tools → observe) is exactly what the Agent Platform is designed to run.

---

## System Overview

OrbitKeeper follows a **3-tier cloud-native architecture** running on **Google Cloud Run** and **Google Agent Platform (Vertex AI)**, with a deliberate **dual-database design**:

- **MongoDB Atlas**: Serves as the primary system of record for structured career applications, resumes, profiles, match scores, and deadline logs (interfaced exclusively via 14 standardized MCP tools).
- **Google Cloud Firestore**: Serves as the user-isolated conversational memory layer and Personal Gemini Journal (`users/{uid}/journalEntries`), storing chat history, context-grounded summaries, and AI career reflections.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Client - Vercel)                                     │
│  - React 18 SPA · Tailwind CSS · Glassmorphic UI                          │
│  - Firebase Auth SDK (Google OAuth 2.0 Client-Side Flow)                  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTPS + Verified Bearer JWT
┌─────────────────────────────────────▼─────────────────────────────────────┐
│  APPLICATION LAYER (Google Cloud Run - "orbitkeeper-api")                  │
│  - Express REST API (Node.js ES Modules, Containerized)                   │
│  - Firebase Admin SDK Token Verification (Strict req.user.uid)            │
│  - Google Cloud Secret Manager (Dynamic credential loading & caching)     │
│  - 6 AI Agents (Gemini 3.5 Flash via Vertex AI)                           │
│  - MCP Server (14 Tools) + Resilient MCP Client with Direct Fallback       │
│  - Autonomous Deadline Monitor (node-cron + Nodemailer)                   │
└───────────────────┬───────────────────────────────────┬───────────────────┘
                    │ MCP Protocol                      │ Firebase Admin SDK
┌───────────────────▼───────────────┐   ┌───────────────▼───────────────────┐
│  MONGODB ATLAS (CAREER STORE)     │   │  GOOGLE CLOUD FIRESTORE (JOURNAL) │
│  - Applications & Match Scores    │   │  - User-Isolated Conversations    │
│  - Profiles & Parsed Resumes      │   │  - AI Reflections (Takeaways/Next)│
│  - Notification Audit Logs        │   │  - Path: users/{uid}/journalEntries│
│  (Interfaced via 14 MCP Tools)    │   │  (Strict UID-partitioned storage) │
└───────────────────────────────────┘   └───────────────────────────────────┘
```


---

## Architecture Layers

### Layer 1: Frontend (React SPA)

**Tech Stack**:
- React 18.3 with hooks
- React Router v6 for navigation
- Tailwind CSS for styling
- Vite for build tooling
- Firebase SDK for authentication
- Axios for HTTP requests

**Key Features**:
- Client-side routing (no page refresh)
- Protected routes (require authentication)
- Context API for global state
- Responsive design (mobile-friendly)
- Real-time loading states

**Component Structure**:
```
client/src/
├── components/         # Reusable UI components
├── pages/             # Page-level components
├── contexts/          # Global state management
└── lib/               # Utilities & API client
```

### Layer 2: Backend (Google Cloud Run / Express Server)

**Tech Stack**:
- Node.js 18+ (ES Modules)
- Express.js 4.x
- Docker container deployed on **Google Cloud Run** (`orbitkeeper-api`)
- @modelcontextprotocol/sdk 1.0.4 (MCP Server + resilient client fallback)
- @google-cloud/vertexai 1.9.0 (Gemini 3.5 Flash)
- @google-cloud/secret-manager (Dynamic secret resolution with in-memory caching)
- Firebase Admin SDK (Auth token verification & Google Cloud Firestore)
- Mongoose 8.x (MongoDB Atlas connection)
- node-cron for scheduling & Nodemailer for deadline email alerts

**Key Components**:

1. **Express Server & Cloud Run Bootstrap** - Binds `0.0.0.0:${PORT}` dynamically, runs health checks immediately, connects to MongoDB asynchronously.
2. **Secret Manager Utility (`server/utils/secrets.js`)** - Fetches production keys (`MONGODB_URI`, `FIREBASE_PRIVATE_KEY`, etc.) directly from GCP Secret Manager with caching, falling back to local `.env` during development.
3. **Firestore Journal Service (`server/utils/firestoreJournal.js`)** - Persists and rehydrates conversational turns and AI reflections scoped strictly by verified Firebase UID.
4. **MCP Server & Client (`server/mcp/`)** - 14 registered tools with schema validation, plus an in-process direct handler fallback for container resilience.
5. **AI Agents (`server/agents/`)** - 6 specialized agents powered by Gemini 3.5 Flash, including the Career Memory Agent with Firestore context fusion.
6. **Middleware (`server/middleware/auth.js`)** - Zero-trust token validation extracting `req.user.uid` from Firebase Bearer JWTs.

**Server Structure**:
```
server/
├── mcp/               # MCP server, tool handlers, and resilient client
├── agents/            # 6 AI agent definitions (Gemini 3.5 Flash)
├── controllers/       # API endpoint handlers (agent, applications, profile)
├── models/            # Mongoose schemas (Application, Profile, NotificationLog)
├── routes/            # Express routes (agent, applications, profile, health)
├── middleware/        # Firebase Auth verification & error handling
└── utils/             # Firestore journal, Secret Manager, Gemini, DB, email
```

### Layer 3: Data & Services

**1. MongoDB Atlas (Career Applications & Profile Store)**:
- **Role**: Primary system of record for structured career tracking data.
- **Collections**: 3 collections (`applications`, `profiles`, `notification_logs`).
- **Access Pattern**: Accessed strictly through the 14 MCP tools with user isolation by `userId`.
- **Note**: Retains all application metadata, match scores, resume text, action plans, and notification logs.

**2. Google Cloud Firestore (Conversational Journal & Reflection Layer)**:
- **Role**: User-isolated conversational memory and Personal Gemini Journal store.
- **Collection Path**: `users/{uid}/journalEntries/{entryId}`.
- **Stored Data**: Multi-turn dialogue (`userMessage`, `assistantResponse`), AI reflection metadata (`summary`, `keyDecision`, `nextAction`), and timestamps.
- **Security**: Strict UID-partitioned hierarchy enforced by Firebase Admin SDK on the backend and `firestore.rules` for client security.

**3. Google Cloud Secret Manager**:
- **Role**: Centralized secret storage for production deployment.
- **Secrets Managed**: `MONGODB_URI`, `FIREBASE_PRIVATE_KEY`, `EMAIL_PASS`, etc.
- **Behavior**: Secrets are loaded asynchronously on-demand and cached in memory, preventing plaintext credentials from ever touching git or container images.

**4. Firebase Authentication**:
- **Provider**: Google OAuth 2.0.
- **Token**: Verified Firebase ID Token (JWT) with 1-hour expiry.
- **Verification**: Backend verifies signature via Firebase Admin SDK and scopes all database operations to `req.user.uid`.

**5. Google Agent Platform (Vertex AI)**:
- **Model**: Gemini 3.5 Flash (`gemini-3.5-flash`).
- **Endpoint**: global (Gemini 3 family is served on the global endpoint).
- **Authentication**: Google Application Default Credentials / Service Account.

**6. Gmail SMTP**:
- **Service**: Gmail SMTP server with TLS.
- **Purpose**: Autonomous 24h and 12h email reminder delivery.

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
[Browser]
   │
   ├─> Click "Sign in with Google"
   │
   ▼
[Firebase Auth SDK]
   │
   ├─> Redirect to Google OAuth
   │
   ▼
[Google OAuth]
   │
   ├─> User approves
   │
   ▼
[Firebase Auth SDK]
   │
   ├─> Receives JWT token
   │
   ▼
[AuthContext]
   │
   ├─> Stores user state
   │
   ▼
[Protected Routes]
   │
   ├─> Every API call includes token
   │
   ▼
[Backend Middleware]
   │
   ├─> verifyToken() validates JWT
   │
   ▼
[Request proceeds with userId]
```


### 2. AI Analysis Flow (Complete Pipeline)

```
[User uploads resume]
   │
   ▼
[POST /api/resume/upload]
   │
   ├─> Parse PDF/TXT
   ├─> Extract text (3500+ chars)
   │
   ▼
[Resume Analysis Agent]
   │
   ├─> Call Gemini 3.5 Flash
   ├─> Parse skills, projects, experience
   │
   ▼
[MCP Tool: update_profile]
   │
   ├─> Store in MongoDB profiles collection
   │
   ▼
[User adds application with job description]
   │
   ▼
[POST /api/agent/analyze/:id]
   │
   ├─> MCP Tool: find_documents  ← Get application
   ├─> MCP Tool: get_profile     ← Get resume
   │
   ▼
[Job Analysis Agent]
   │
   ├─> Gemini 3.5 Flash: Analyze job description
   ├─> Extract: required skills, responsibilities, benefits
   │
   ▼
[Resume Analysis Agent]
   │
   ├─> Gemini 3.5 Flash: Match resume vs job
   ├─> Calculate: match score (0-100)
   ├─> Identify: strengths, weaknesses, gaps
   │
   ▼
[Career Planning Agent]
   │
   ├─> Gemini 3.5 Flash: Generate action plan
   ├─> Create: 7 prioritized tasks
   │
   ▼
[Interview Prep Agent]
   │
   ├─> Gemini 3.5 Flash: Generate questions
   ├─> Categories: technical, behavioral, resume-based
   │
   ▼
[MCP Tool: store_ai_analysis]
   │
   ├─> Store all results in MongoDB
   │
   ▼
[Return to frontend]
   │
   ├─> Display match score, tasks, questions
```


### 3. Deadline Monitoring Flow (Autonomous)

```
[Cron Job - Every 2 minutes]
   │
   ▼
[Deadline Monitor Agent]
   │
   ├─> MCP Tool: get_upcoming_deadlines
   ├─> Filter: hoursAhead=30, status='saved'
   │
   ▼
[For each application:]
   │
   ├─> Calculate hours until deadline
   ├─> Check if reminder needed (24h or 12h window)
   │
   ▼
[If reminder needed:]
   │
   ├─> Firebase Auth: getUser(userId)  ← Get email
   ├─> sendDeadlineReminder()          ← Send HTML email
   │
   ▼
[After email sent:]
   │
   ├─> MCP Tool: mark_reminder_sent
   ├─> MCP Tool: log_notification
   │
   ▼
[Notification logged in MongoDB]
```

**Reminder Windows**:
- **24h reminder**: Fires when deadline is 20-24 hours away
- **12h reminder**: Fires when deadline is 10-12 hours away
- **No overlap**: Clear separation prevents duplicate reminders

### 4. Personal Gemini Journal & Career Reflection Flow

```
[User sends chat message in CopilotChat]
   │
   ▼
[POST /api/agent/ask]
   │
   ├─> Firebase Admin SDK verifies JWT Bearer token
   ├─> Extracts authenticated req.user.uid (zero-trust, client cannot override)
   │
   ▼
[Career Memory Agent]
   │
   ├─> 1. Fetch user's career context via MCP tools:
   │      - MCP: find_documents (MongoDB applications)
   │      - MCP: get_profile (MongoDB profile & parsed resume)
   │
   ├─> 2. Fetch conversational context from Google Cloud Firestore:
   │      - firestoreJournal.getJournalHistory(userId, 10)
   │      - Reads from users/{uid}/journalEntries ordered by createdAt
   │
   ├─> 3. Compose Multi-Turn Grounded Prompt for Gemini 3.5 Flash:
   │      - Injects system instructions & persona
   │      - Injects full MongoDB career telemetry
   │      - Injects last 10 conversational turns
   │      - Appends user's current question
   │
   ▼
[Gemini 3.5 Flash (Vertex AI)]
   │
   ├─> Generates conversational answer
   ├─> Generates structured Career Reflection:
   │      - summary: concise synthesis of discussion
   │      - keyDecision: tactical/strategic decision identified
   │      - nextAction: concrete next step to take
   │
   ▼
[Firestore Journal Service]
   │
   ├─> firestoreJournal.saveJournalEntry(userId, {
   │      sessionId, userMessage, assistantResponse,
   │      summary, keyDecision, nextAction
   │   })
   ├─> Persists document into users/{uid}/journalEntries/{entryId}
   │
   ▼
[Express Server returns JSON]
   │
   ▼
[CopilotChat UI updates state]
   │
   ├─> Appends new assistant message to chat timeline
   └─> Renders interactive Reflection Badges (Key Decision & Next Action)
```

---

## MCP Integration

### What is MCP?

**Model Context Protocol** is an open standard for connecting AI agents to data sources and tools.

**Benefits**:
- ✅ Standardized tool interface
- ✅ Type-safe schemas (Zod)
- ✅ Error handling patterns
- ✅ Audit trail & logging
- ✅ Easy testing & mocking


### OrbitKeeper's MCP Architecture

```
┌─────────────────────────────────────────────────────┐
│              AI Agents (Reasoning Layer)            │
│  - Job Analysis Agent                               │
│  - Resume Analysis Agent                            │
│  - Career Planning Agent                            │
│  - Interview Prep Agent                             │
│  - Career Memory Agent                              │
│  - Deadline Monitor Agent                           │
└─────────────────────┬───────────────────────────────┘
                      │ mcpClient.callTool()
                      ▼
┌─────────────────────────────────────────────────────┐
│           MCP Client (Singleton)                    │
│  - HTTP client to MCP server                        │
│  - Request/response formatting                      │
│  - Error handling & retries                         │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP POST /mcp
                      ▼
┌─────────────────────────────────────────────────────┐
│           MCP Server (Tool Registry)                │
│  - 14 registered tools with Zod schemas             │
│  - Input validation                                 │
│  - Tool → Handler mapping                           │
└─────────────────────┬───────────────────────────────┘
                      │ Direct function call
                      ▼
┌─────────────────────────────────────────────────────┐
│         Tool Handlers (Business Logic)              │
│  - MongoDB operations (Mongoose)                    │
│  - Data transformations                             │
│  - Error handling                                   │
└─────────────────────┬───────────────────────────────┘
                      │ Mongoose queries
                      ▼
┌─────────────────────────────────────────────────────┐
│            MongoDB Atlas (Data Store)               │
│  Collections: applications, profiles,               │
│               notification_logs                     │
└─────────────────────────────────────────────────────┘
```


### MCP Tools Reference

**Generic CRUD Tools** (6 tools):
1. **find_documents** - Query with filters, sort, limit
2. **insert_document** - Create new document
3. **update_document** - Update by ID
4. **delete_document** - Delete by ID
5. **aggregate** - Run aggregation pipeline
6. **list_collections** - Discover collections

**Career-Specific Tools** (8 tools):
7. **store_ai_analysis** - Save AI analysis results
8. **get_upcoming_deadlines** - Find deadlines with time window & user filter
9. **get_dashboard_stats** - Calculate metrics by status & avg match score
10. **mark_reminder_sent** - Track email status (24h/12h flags)
11. **log_notification** - Audit trail for email sends
12. **get_profile** - User profile with retry logic for replication lag
13. **update_profile** - Update profile while preserving resumeText
14. **search_applications** - Full-text search

### Why MCP Gives "Superpowers"

**Traditional Approach** (Without MCP):
- Agents directly import and query database
- Each agent needs database knowledge
- Tight coupling between agents and data layer
- Hard to test, maintain, and scale
- No audit trail or standardization

**MCP Approach** (OrbitKeeper):
- Agents use standardized MCP tools
- Separation of concerns: Agents focus on reasoning, tools handle data
- Easy testing: Mock MCP tools without database
- Audit trail: Every tool call is logged
- Scalability: Add new tools without changing agents
- Official SDK: Using @modelcontextprotocol/sdk v1.0.4


---

## AI Agent System

### Agent Architecture Pattern

**All agents follow this pattern**:

1. **Input**: Receive user context and specific data
2. **Fetch Data**: Call MCP tools if needed
3. **Build Prompt**: Construct context-aware prompt for Gemini
4. **Call AI**: Execute Gemini 3.5 Flash with retry logic
5. **Parse Response**: Validate and structure the AI output
6. **Return Result**: Send structured data back

### 6 Specialized Agents

#### 1. Job Analysis Agent

**Purpose**: Analyze job descriptions and extract key information

**Input**:
- Job description text
- Company name

**Output Structure**:
- Required skills (array)
- Preferred skills (array)
- Experience required (string)
- Responsibilities (array)
- Benefits (array)
- Summary (string)

**Process**: Uses Gemini 3.5 Flash to extract structured information from unstructured job postings.

---

#### 2. Resume Analysis Agent

**Purpose**: Parse resumes and calculate match scores

**Two Main Functions**:

**A. Extract Resume Info**:
- Input: Resume text from uploaded PDF/TXT
- Output: Name, email, skills, projects, work experience, education
- Process: Gemini parses unstructured resume into structured data

**B. Analyze Resume Against Job**:
- Input: Resume text + Job description + Job summary
- Output: Match score (0-100), strength areas, weakness areas, missing skills, improvement suggestions
- Process: Gemini compares resume to job requirements and calculates compatibility


**Match Score Algorithm**:
1. Compare resume skills vs required skills
2. Weight: Required skills > Preferred skills
3. Factor in: Projects, experience level, education
4. Calculate percentage match
5. Identify gaps and weaknesses

---

#### 3. Career Planning Agent

**Purpose**: Generate actionable 7-step career plans

**Input**:
- Resume text
- Job summary
- Missing skills
- Current match score

**Output Structure**:
- Action plan (array of 7 tasks)
- Each task has: task description, priority (high/medium/low), completed flag

**Task Categories**:
- Skill building (courses, tutorials, certifications)
- Project ideas (portfolio work to demonstrate skills)
- Resume improvements (how to highlight relevant experience)
- Application prep (research, networking, tailoring)

---

#### 4. Interview Prep Agent

**Purpose**: Generate role-specific interview questions

**Input**:
- Role title
- Company name
- Job description
- Resume text
- Required skills

**Output Categories**:
- **Technical questions**: Based on required skills and role
- **Behavioral questions**: Soft skills and culture fit
- **Resume-based questions**: About specific projects/experience
- **Project-based questions**: Deep dives into technical work
- **Role-specific questions**: Tailored to the job responsibilities


---

#### 5. Career Memory Agent & AI Career Journal

**Purpose**: Conversational AI copilot and Personal Gemini Journal grounded in live career telemetry and historical reflections.

**Input**:
- User question
- `userId` (strictly verified from Firebase JWT `req.user.uid`)
- Optional `sessionId`

**Dual-Store Context Pipeline**:
1. **MCP Career Grounding (MongoDB Atlas)**:
   - Invokes `find_documents` to retrieve the user's active applications, statuses, deadlines, and match scores.
   - Invokes `get_profile` to retrieve skills, experiences, and uploaded resume text.
2. **Conversational Memory (Google Cloud Firestore)**:
   - Calls `firestoreJournal.getJournalHistory(userId, 10)` to load the 10 most recent conversation turns from `users/{userId}/journalEntries`.
   - Formats historical Q&A pairs into conversational context.
3. **Reasoning & Reflection (Gemini 3.5 Flash via Vertex AI)**:
   - Synthesizes the user's inquiry with system constitution guidelines (`SYSTEM_INSTRUCTIONS.md`).
   - Produces a helpful, grounded response.
   - Concurrently generates an **AI Career Reflection** formatted as JSON:
     - `summary`: Concise summary of what was discussed or accomplished.
     - `keyDecision`: Key career strategic decision or insight reached.
     - `nextAction`: Concrete next step for the user to execute.
4. **Persistence (Firestore Journal Layer)**:
   - Calls `firestoreJournal.saveJournalEntry()` to write the turn, response, and reflection badges to `users/{userId}/journalEntries/{entryId}` with a server timestamp.

**Interactive Reflection Badges**:
The frontend dynamically displays the structured reflection below the assistant's message:
- 💡 **Key Decision Pill**: Highlights strategic guidance (e.g., *"Focus on distributed systems questions for VideoDubber"*).
- 🎯 **Next Action Pill**: Points to the immediate actionable task (e.g., *"Review Redis caching and async worker architectures"*).

**Example Prompts**:
- "Review my application pipeline and tell me where I stand."
- "What's my average match score across frontend vs full-stack roles?"
- "Help me prepare for my technical interview with VideoDubber tomorrow."
- "What skill gaps should I prioritize closing this week based on my target jobs?"

---

#### 6. Deadline Monitor Agent (Autonomous)

**Purpose**: Proactive deadline reminder system

**Execution**: Cron job running every 2 minutes

**Process Flow**:

1. **Query Deadlines**:
   - Call MCP tool: get_upcoming_deadlines
   - Filter: Next 30 hours, status='saved' only
   - Get list of applications approaching deadline

2. **For Each Application**:
   - Calculate hours until deadline
   - Check 24h window (20-24 hours before)
   - Check 12h window (10-12 hours before)

3. **If Reminder Needed**:
   - Get user email from Firebase Authentication
   - Send styled HTML email via Gmail SMTP
   - Email includes: Company, role, deadline, countdown timer
   - Mark reminder flag as sent (24h or 12h)
   - Log notification in audit trail

**Key Features**:
- Fully autonomous (no user action needed)
- Smart windows prevent duplicate reminders
- Only reminds for 'saved' status (not already applied)
- Fetches recipient email from Firebase (no hardcoding)


---

## Authentication & Security

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Client Authentication (Firebase Auth + Google OAuth 2.0)          │
│  - User signs in via Google OAuth popup / redirect                          │
│  - Firebase client SDK issues cryptographically signed JWT ID Token (1h)    │
│  - Token attached to every HTTP request: Authorization: Bearer <token>      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│  LAYER 2: Server-Side Token Verification & Zero-Trust UID Scoping           │
│  - Express auth middleware (server/middleware/auth.js) intercepts requests  │
│  - Firebase Admin SDK validates signature, expiry, and project issuer       │
│  - Extracts authenticated req.user.uid directly from verified claims        │
│  - ZERO-TRUST: Client-supplied userIds in request body or params are IGNORED│
└───────────────────┬───────────────────────────────────┬─────────────────────┘
                    │                                   │
┌───────────────────▼───────────────┐   ┌───────────────▼─────────────────────┐
│  LAYER 3A: MongoDB MCP Isolation  │   │  LAYER 3B: Firestore Rules Isolation│
│  - All queries force { userId }   │   │  - Path: users/{uid}/journalEntries │
│  - Profiles, apps, logs filtered  │   │  - firestore.rules:                 │
│  - No cross-tenant access possible│   │    allow read, write:               │
│                                   │   │      if request.auth.uid == userId  │
└───────────────────────────────────┘   └─────────────────────────────────────┘
```

### Security Implementation Highlights

#### 1. Zero-Trust UID-Based Isolation
- **Threat Model**: A malicious user attempts to view another user's career applications, resume details, or private journal reflections by modifying client requests.
- **Enforcement**:
  1. **Strict Server Extraction**: All API controllers and AI agents use `req.user.uid` extracted exclusively by `admin.auth().verifyIdToken()`.
  2. **MongoDB Scoping**: Every MCP tool handler (`find_documents`, `get_profile`, `update_profile`, etc.) strictly binds the query filter to the authenticated `userId`.
  3. **Firestore Scoping**: All journal operations (`saveJournalEntry`, `getJournalHistory`) enforce the document path `users/${req.user.uid}/journalEntries`.
  4. **Database Rules**: `firestore.rules` enforces that direct client connections cannot read or write to paths belonging to another UID.

#### 2. Google Cloud Secret Manager
- **Elimination of Plaintext Secrets**: In production, sensitive configuration values (such as `MONGODB_URI`, `FIREBASE_PRIVATE_KEY`, and SMTP credentials) are retrieved directly from GCP Secret Manager via `server/utils/secrets.js`.
- **In-Memory Caching**: Secrets are fetched asynchronously and cached in a local process dictionary (`cachedSecrets`), eliminating redundant network round-trips while keeping credentials out of `.env` files in deployed containers.
- **Graceful Local Fallback**: In local development (`NODE_ENV !== 'production'`), the utility automatically falls back to local `.env` variables without requiring local GCP credentials.

#### 3. Network & Transport Security
- **Strict HTTPS / TLS**: All traffic between the Vercel frontend, Cloud Run backend, MongoDB Atlas, and Vertex AI is encrypted in transit using TLS 1.3.
- **CORS Allowlist**: Express CORS middleware restricts requests strictly to the production frontend domain (`https://orbitkeeper.vercel.app`) and `localhost:5173` during development.
- **Payload Validation**: Mongoose schemas enforce data types and lengths, while Zod schemas validate all MCP tool arguments before execution.


---

## Database Schema

### Collection 1: `applications`

**Core Information**:
- company (String, required)
- role (String, required)
- location (String)
- jobType (Enum: internship, full-time, part-time, contract)
- jobUrl (String)

**Status Tracking**:
- status (Enum: saved, applied, phone_screen, technical, interview, offer, rejected, withdrawn)

**Important Dates**:
- deadline (Date)
- appliedDate (Date)
- interviewDate (Date)

**AI Analysis Results**:
- jobDescription (String - raw text)
- jobSummary (Object with: requiredSkills, preferredSkills, experienceRequired, responsibilities, benefits, summary)
- matchScore (Number 0-100)
- strengthAreas (Array of strings)
- weaknessAreas (Array of strings)
- missingSkills (Array of strings)
- improvementSuggestions (Array of strings)

**Career Plan**:
- actionPlan (Array of objects with: task, priority, completed, createdAt)

**Interview Prep**:
- interviewQuestions (Object with: technical, behavioral, projectBased, resumeBased, roleSpecific arrays)

**Other Fields**:
- notes (String - user's notes)
- reminder24hSent (Boolean)
- reminder12hSent (Boolean)
- userId (String, indexed)
- createdAt, updatedAt (Timestamps)

**Indexes**:
- deadline + status (for deadline monitoring)
- userId + createdAt (for user queries)


---

### Collection 2: `profiles`

**User Identification**:
- userId (String, unique, indexed)

**Personal Information**:
- name, email, phone
- university, major, graduationYear
- linkedin, github, portfolio

**Career Goals**:
- careerGoals (String)
- targetRoles (Array)
- targetIndustries (Array)
- preferredLocations (Array)

**Skills** (Extracted from resume by AI):
- skills (Array)
- programmingLanguages (Array)
- frameworks (Array)
- tools (Array)

**Resume Data**:
- resumeText (String - full text, 3000+ chars)
- resumeFileName (String)
- resumeUploadedAt (Date)

**Experience & Education**:
- workExperience (Array of objects: company, role, duration, description)
- education (Array of objects: institution, degree, field, year)

**Projects**:
- projects (Array of objects: name, description, techStack, url)

**Timestamps**:
- createdAt, updatedAt

---

### Collection 3: `notification_logs` (MongoDB Atlas)

**Purpose**: Audit trail for all email notifications

**Fields**:
- `applicationId` (ObjectId reference)
- `company` (String)
- `role` (String)
- `notificationType` (Enum: `24_hour_reminder`, `12_hour_reminder`)
- `channel` (String: `'email'`)
- `sentTo` (String - email address)
- `status` (Enum: `sent`, `failed`, `skipped`)
- `errorMessage` (String - if failed)
- `createdAt` (Date)

---

### Dual Data-Store Architectural Note

> **System of Record Distinction**:
> - **MongoDB Atlas**: Remains the dedicated system of record for all **structured career data** — job applications, company details, AI match scores, user profiles, uploaded resume text, and notification logs. All access is mediated through the 14 MCP tools.
> - **Google Cloud Firestore**: Serves exclusively as the **conversational journal layer** and memory store. It records multi-turn dialogue, session metadata, and structured AI reflections (`summary`, `keyDecision`, `nextAction`) under user-isolated subcollections.

---

### Collection 4 (Google Cloud Firestore): `users/{userId}/journalEntries`

**Purpose**: Multi-turn conversational memory and Personal Gemini Journal with auto-generated career reflections.

**Document Path**: `users/{userId}/journalEntries/{entryId}`

**Document Structure**:
- `userMessage` (String): The question, update, or reflection prompt sent by the candidate.
- `assistantResponse` (String): The grounded response generated by Gemini 3.5 Flash.
- `summary` (String): Concise synthesis of the topic and progress discussed in this turn.
- `keyDecision` (String): Clear career or interview strategic decision identified by the agent.
- `nextAction` (String): Concrete, prioritized action step for the user to execute next.
- `sessionId` (String): Logical session grouping identifier (e.g. `career-journal-default`).
- `createdAt` (Firestore Timestamp): Timestamp set via `admin.firestore.FieldValue.serverTimestamp()` for chronological sorting.

**Indexing & Queries**:
- Ordered by `createdAt ASC` to rehydrate conversational turns for prompt multi-turn context (limited to the last 10 entries).
- Partitioned naturally under the user's top-level document (`users/{userId}`), preventing any cross-user leakage.

---

## API Endpoints

**Authentication**: All endpoints (except `/api/health`) require Firebase JWT token in `Authorization: Bearer <token>` header. The authenticated user ID (`req.user.uid`) is extracted server-side.

### Applications (MongoDB via MCP)

- **GET `/api/applications`** - Get all applications for authenticated user
- **GET `/api/applications/:id`** - Get single application by ID
- **POST `/api/applications`** - Create new application
- **PUT `/api/applications/:id`** - Update application fields
- **DELETE `/api/applications/:id`** - Delete application

### AI Agent Operations & Personal Journal

- **POST `/api/agent/analyze/:id`** - Run full AI analysis pipeline (job analysis → resume matching → career planning → interview prep)
- **POST `/api/agent/ask`** - Multi-turn chat with Career Memory Agent (fuses MongoDB context + Firestore journal history, generates AI reflection, persists turn to Firestore)
- **GET `/api/agent/history`** - Retrieve user's past journal entries and AI reflections from Google Cloud Firestore
- **GET `/api/agent/interview-questions/:id`** - Generate interview questions for application

### Profile & Resume (MongoDB via MCP)

- **GET `/api/profile`** - Get user profile
- **PUT `/api/profile`** - Update user profile (preserves resumeText)
- **POST `/api/resume/upload`** - Upload resume (PDF or TXT) and trigger AI parsing

### Notifications (MongoDB via MCP)

- **GET `/api/notifications`** - Get notification logs for user

### MCP

- **POST `/mcp`** - Internal MCP server endpoint (used by mcpClient)
- **GET `/api/mcp/tools`** - Get list of available MCP tools with schemas

### Health Check

- **GET `/api/health`** - Public endpoint, no auth required, returns server status and timestamp


---

## Deployment Architecture

### Production Stack Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Vercel (Frontend CDN Edge)                                               │
│  - React 18 SPA build (Vite)                                              │
│  - Automatic HTTPS & Global Edge Caching                                  │
│  - URL: https://orbitkeeper.vercel.app                                    │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTPS (with Firebase Bearer JWT)
┌─────────────────────────────────────▼─────────────────────────────────────┐
│  Google Cloud Run (Backend Microservice: "orbitkeeper-api")               │
│  - Region: us-central1 (Fully Managed Serverless Container)               │
│  - Multi-stage Docker image (Node.js 18-alpine, non-root user nodejs)     │
│  - Dynamic PORT binding (8080) with instant health check readiness        │
│  - Scales to zero on inactivity ($0/month free tier)                      │
│  - URL: https://orbitkeeper-api-78957386687.us-central1.run.app           │
└──┬──────────────┬──────────────┬──────────────┬───────────────────────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
MongoDB        Google Cloud   Google Cloud   Firebase Auth
Atlas          Firestore      Secret Mgr     & Vertex AI
(Career Data)  (Journal)      (Credentials)  (Gemini 3.5 Flash)
```

### Containerization & Cloud Run Engineering

1. **Production Dockerfile (`server/Dockerfile`)**:
   - Uses `node:18-alpine` for minimal attack surface and fast startup.
   - Non-root runtime security: creates and switches to user `nodejs:nodejs`.
   - Exposes port `8080` (Cloud Run default).

2. **Zero-Downtime Cold Start Engineering**:
   - Cloud Run monitors the container's bound port before routing HTTP traffic.
   - `server/index.js` explicitly binds `app.listen(PORT, '0.0.0.0')` *prior* to database connection attempts, ensuring the container immediately responds to Cloud Run health checks and prevents deployment boot timeouts.
   - `connectDB()` connects to MongoDB Atlas asynchronously and non-fatally.

3. **In-Process MCP Resiliency**:
   - `server/mcp/mcpClient.js` dynamically resolves `PORT` to avoid hardcoded localhost ports.
   - Includes an in-process direct fallback directly executing handlers from `server/mcp/toolHandlers.js`, ensuring agent tool calls succeed even during container warm-up phases.

### Environment Variables

**Backend (Google Cloud Run / Secret Manager)**:
- `PORT` (Injected by Cloud Run, defaults to 8080)
- `NODE_ENV=production`
- `CLIENT_URL=https://orbitkeeper.vercel.app`
- `GOOGLE_CLOUD_PROJECT=orbitkeeper`
- `GOOGLE_CLOUD_LOCATION=global`
- `GOOGLE_CLOUD_MODEL=gemini-3.5-flash`
- `MONGODB_URI` (Loaded via Secret Manager or environment)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (For Firebase Admin & Firestore)
- `EMAIL_USER`, `EMAIL_PASS` (For autonomous deadline reminder delivery)

**Frontend (Vercel)**:
- `VITE_API_URL=https://orbitkeeper-api-78957386687.us-central1.run.app`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`


---

## Performance & Scalability

### Current Performance Metrics

**Frontend**:
- Initial load: ~2-3 seconds (Vite optimized, code splitting)
- Route changes: Instant (client-side routing)
- API calls: 200-500ms average response time

**Backend**:
- Health check: < 50ms
- Simple database queries: 100-200ms
- AI analysis (full pipeline): 10-15 seconds total
  - Job analysis: 2-3s
  - Resume matching: 3-4s
  - Career planning: 2-3s
  - Interview questions: 3-4s

**Identified Bottlenecks**:
1. Gemini API calls (currently sequential) - Could parallelize with Promise.all
2. Cloud Run cold starts on scale-from-zero - ~5-10s for initial container spin up after idle
3. MongoDB free tier (512MB storage, limited throughput)

### Scalability Limits (Free Tiers)

**Vercel**: 
- 100GB bandwidth/month
- 6000 build minutes/month
- Suitable for 1000+ users

**Google Cloud Run**:
- 2,000,000 requests/month free tier
- 360,000 GiB-seconds compute time
- Automatic scaling from 0 to multiple concurrent instances
- Zero cost when idle

**MongoDB Atlas**:
- 512MB storage (~10,000-50,000 applications)
- ~500MB/sec throughput
- Shared cluster (limited CPU)

**Gmail SMTP**:
- 500 emails/day limit
- Restricts deadline reminders to 500 users/day

**Estimated Capacity**:
- Concurrent users: 100-500
- Total applications: 10,000-50,000
- AI analyses per day: 1,000-2,000
- Email reminders per day: 500 (Gmail limit)


### Optimization Strategies

**Already Implemented**:
- ✅ MongoDB indexes for fast deadline and user queries
- ✅ Lean queries (bypass Mongoose hydration overhead)
- ✅ Read from primary (avoid replication lag issues)
- ✅ MCP client singleton & resilient direct fallback
- ✅ Frontend code splitting with Vite
- ✅ Retry logic for Gemini rate limits

**Future Improvements** (if needed for scale):
- ⏳ Parallelize Gemini API calls using Promise.all
- ⏳ Add Redis caching layer for frequent queries
- ⏳ Configure `--min-instances=1` on Cloud Run (eliminates cold starts)
- ⏳ Use SendGrid or AWS SES for emails (higher limits)
- ⏳ Add pagination for application lists
- ⏳ Implement request queueing with Bull

---

## Summary

OrbitKeeper is a production-ready AI career copilot and Personal Gemini Journal with:
- ✅ **Cloud-Native 3-Tier Architecture**: React 18 frontend on Vercel + containerized Express API on Google Cloud Run.
- ✅ **Dual Data-Store Design**: MongoDB Atlas for structured career data (via 14 MCP tools) + Google Cloud Firestore for user-isolated conversational journals.
- ✅ **6 Autonomous Agents**: Specialized workflows powered by Gemini 3.5 Flash on Google Agent Platform (Vertex AI).
- ✅ **AI Career Reflection Journal**: Stateful multi-turn chat logging with synthesized summaries, strategic decisions, and prioritized next actions.
- ✅ **Zero-Trust Security**: Verified Firebase Admin JWT tokens (`req.user.uid`), matching Firestore security rules, and Google Cloud Secret Manager integration.
- ✅ **Autonomous Deadline Agent**: 24/7 background scheduler guarding career deadlines with automated email notifications.
- ✅ **$0/Month Production Stack**: Architected to run reliably entirely on managed free tiers.


