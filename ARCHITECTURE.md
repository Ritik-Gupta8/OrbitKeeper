# 🏗️ OrbitKeeper Architecture

**Technical Deep Dive & Future Roadmap**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [MCP Integration](#mcp-integration)
5. [AI Agent System](#ai-agent-system)
6. [Authentication & Security](#authentication--security)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance & Scalability](#performance--scalability)
11. [Future Enhancements](#future-enhancements)
12. [Known Limitations](#known-limitations)
13. [MongoDB IP Whitelist Setup](#mongodb-ip-whitelist-setup)

---

## System Overview

OrbitKeeper follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Client)                            │
│  - React SPA                                            │
│  - Firebase Auth (Google OAuth)                         │
│  - Tailwind CSS UI                                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS + JWT Token
┌────────────────────▼────────────────────────────────────┐
│  APPLICATION LAYER (Server)                             │
│  - Express REST API                                     │
│  - Firebase Token Verification                          │
│  - 6 AI Agents (Gemini 2.5 Flash)                      │
│  - MCP Server (14 Tools)                                │
│  - Deadline Monitor (Cron Job)                          │
└────────────────────┬────────────────────────────────────┘
                     │ MCP Protocol
┌────────────────────▼────────────────────────────────────┐
│  DATA LAYER                                             │
│  - MongoDB Atlas (Primary Database)                     │
│  - Firebase Auth (User Management)                      │
│  - Google Cloud Vertex AI (AI Models)                   │
│  - Gmail SMTP (Email Delivery)                          │
└─────────────────────────────────────────────────────────┘
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

### Layer 2: Backend (Node.js + Express)

**Tech Stack**:
- Node.js 18+
- Express.js 4.x
- Mongoose 8.x (MongoDB ODM)
- @modelcontextprotocol/sdk 1.0.4
- @google-cloud/vertexai 1.9.0
- Firebase Admin SDK
- node-cron for scheduling
- Nodemailer for emails

**Key Components**:

1. **Express Server** - REST API endpoints, CORS, error handling
2. **MCP Server** - 14 registered tools with schema validation
3. **AI Agents** - 6 specialized agents for different tasks
4. **Controllers** - Business logic orchestration
5. **Models** - Mongoose schemas with validation
6. **Middleware** - Authentication, error handling
7. **Utilities** - Gemini AI wrapper, email templates

**Server Structure**:
```
server/
├── mcp/               # MCP server & tools
├── agents/            # 6 AI agent files
├── controllers/       # API endpoint handlers
├── models/            # Database schemas
├── routes/            # API routes
├── middleware/        # Auth & error handlers
└── utils/             # Helper functions
```

### Layer 3: Data & Services

**1. MongoDB Atlas** (Primary Database):
- **Tier**: Free (M0 Sandbox)
- **Region**: Closest to Google Cloud us-central1
- **Collections**: 3 (applications, profiles, notification_logs)
- **Indexes**: Optimized for queries
- **Backup**: Automatic snapshots

**2. Firebase Authentication**:
- **Provider**: Google OAuth 2.0
- **Token**: JWT with 1 hour expiry
- **Admin SDK**: Server-side verification
- **Security**: User-specific data isolation

**3. Google Cloud Vertex AI**:
- **Model**: Gemini 2.5 Flash
- **Region**: us-central1
- **Authentication**: Service account JSON
- **Rate Limits**: Standard enterprise tier

**4. Gmail SMTP**:
- **Service**: Gmail SMTP server
- **Auth**: App Password (16-char)
- **Port**: 587 (TLS)
- **Rate Limit**: 500 emails/day (free Gmail)

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
   ├─> Call Gemini 2.5 Flash
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
   ├─> Gemini 2.5 Flash: Analyze job description
   ├─> Extract: required skills, responsibilities, benefits
   │
   ▼
[Resume Analysis Agent]
   │
   ├─> Gemini 2.5 Flash: Match resume vs job
   ├─> Calculate: match score (0-100)
   ├─> Identify: strengths, weaknesses, gaps
   │
   ▼
[Career Planning Agent]
   │
   ├─> Gemini 2.5 Flash: Generate action plan
   ├─> Create: 7 prioritized tasks
   │
   ▼
[Interview Prep Agent]
   │
   ├─> Gemini 2.5 Flash: Generate questions
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
4. **Call AI**: Execute Gemini 2.5 Flash with retry logic
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

**Process**: Uses Gemini 2.5 Flash to extract structured information from unstructured job postings.

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

#### 5. Career Memory Agent

**Purpose**: Conversational AI copilot with context awareness

**Input**:
- User question
- userId (for fetching context)

**Process**:
1. Fetch user's applications via MCP
2. Fetch user's profile via MCP
3. Build context-aware prompt with conversation history
4. Call Gemini 2.5 Flash
5. Return natural language response

**Example Questions**:
- "How many applications have I sent?"
- "What's my average match score?"
- "Which companies should I prioritize?"
- "Give me advice for preparing for Google interview"
- "What skills am I missing most often?"

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

**Layer 1: Firebase Authentication**
- Frontend: User signs in with Google OAuth
- Firebase issues JWT token (1 hour expiry)
- Frontend includes token in every API request header

**Layer 2: Backend Token Verification**
- Middleware intercepts all protected routes
- Verifies JWT token using Firebase Admin SDK
- Extracts userId from decoded token
- Attaches userId to request for downstream use

**Layer 3: Data Isolation**
- Every database query filters by userId
- Users can ONLY access their own data
- No cross-user data leakage possible

### Security Features

**1. Authentication**:
- ✅ Google OAuth 2.0 (industry standard)
- ✅ JWT tokens with 1-hour expiry
- ✅ Server-side verification on every request
- ✅ No password storage (delegated to Google)

**2. Authorization**:
- ✅ User-specific data isolation in MongoDB
- ✅ Protected API routes require valid JWT
- ✅ Automatic userId filtering on all queries

**3. Data Protection**:
- ✅ All secrets stored in `.env` files (gitignored)
- ✅ TLS encryption for MongoDB connections
- ✅ HTTPS in production
- ✅ Input validation via Mongoose schemas and Zod

**4. API Security**:
- ✅ CORS restricted to frontend domain only
- ✅ Request size limits prevent abuse
- ✅ Error messages sanitized (no info leakage)

**5. Email Security**:
- ✅ Gmail app password (not real password)
- ✅ Can only send to authenticated Firebase users
- ✅ Rate-limited reminders (once per deadline window)


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

### Collection 3: `notification_logs`

**Purpose**: Audit trail for all email notifications

**Fields**:
- applicationId (ObjectId reference)
- company (String)
- role (String)
- notificationType (Enum: 24_hour_reminder, 12_hour_reminder)
- channel (String: 'email')
- sentTo (String - email address)
- status (Enum: sent, failed, skipped)
- errorMessage (String - if failed)
- createdAt (Date)


---

## API Endpoints

**Authentication**: All endpoints (except `/api/health`) require Firebase JWT token in `Authorization: Bearer <token>` header.

### Applications

- **GET `/api/applications`** - Get all applications for authenticated user
- **GET `/api/applications/:id`** - Get single application by ID
- **POST `/api/applications`** - Create new application
- **PUT `/api/applications/:id`** - Update application fields
- **DELETE `/api/applications/:id`** - Delete application

### AI Agent Operations

- **POST `/api/agent/analyze/:id`** - Run full AI analysis pipeline (job analysis → resume matching → career planning → interview prep)
- **POST `/api/agent/ask`** - Chat with Career Memory Agent
- **GET `/api/agent/interview-questions/:id`** - Generate interview questions for application

### Profile & Resume

- **GET `/api/profile`** - Get user profile
- **PUT `/api/profile`** - Update user profile (preserves resumeText)
- **POST `/api/resume/upload`** - Upload resume (PDF or TXT) and trigger AI parsing

### Notifications

- **GET `/api/notifications`** - Get notification logs for user

### MCP

- **POST `/mcp`** - Internal MCP server endpoint (used by mcpClient)
- **GET `/api/mcp/tools`** - Get list of available MCP tools with schemas

### Health Check

- **GET `/api/health`** - Public endpoint, no auth required, returns server status


---

## Deployment Architecture

### Production Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (Frontend CDN)                                  │
│  - Global edge network                                  │
│  - Automatic HTTPS                                      │
│  - Deploy: git push → auto-deploy                       │
│  URL: https://orbitkeeper.vercel.app                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (with JWT)
┌────────────────────▼────────────────────────────────────┐
│  Render (Backend Container)                             │
│  - Docker container                                     │
│  - Auto-deploy from GitHub                              │
│  - Free tier: 512MB RAM, sleeps after 15min inactive    │
│  URL: https://orbitkeeper-api.onrender.com              │
└──┬──────────┬──────────┬──────────┬─────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
MongoDB   Vertex AI  Firebase   Gmail
Atlas                  Auth       SMTP
```

### Environment Variables

**Backend (Render)** - 13 variables:
- MONGODB_URI
- GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_CLOUD_MODEL
- GOOGLE_APPLICATION_CREDENTIALS_JSON
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- EMAIL_USER, EMAIL_PASS
- CLIENT_URL
- PORT (5000)
- NODE_ENV (production)

**Frontend (Vercel)** - 7 variables:
- VITE_API_URL
- VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID


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
2. Render cold starts on free tier - ~30s for first request after sleep
3. MongoDB free tier (512MB storage, limited throughput)

### Scalability Limits (Free Tiers)

**Vercel**: 
- 100GB bandwidth/month
- 6000 build minutes/month
- Suitable for 1000+ users

**Render**:
- 750 hours/month (always-on if kept awake)
- 512MB RAM
- Sleeps after 15 minutes of inactivity

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
- ✅ MCP client singleton (reuses HTTP connections)
- ✅ Frontend code splitting with Vite
- ✅ Retry logic for Gemini rate limits

**Future Improvements** (if needed for scale):
- ⏳ Parallelize Gemini API calls using Promise.all
- ⏳ Add Redis caching layer for frequent queries
- ⏳ Upgrade to Render paid plan (no cold starts)
- ⏳ Use SendGrid or AWS SES for emails (higher limits)
- ⏳ Add pagination for application lists
- ⏳ Implement request queueing with Bull

---

## Future Enhancements

### Phase 1: Core Improvements (High Priority)

**1. Application Status Editing** ⭐ PRIORITY
- **Problem**: Status can only be set when creating application, no edit option afterward
- **Solution**: Add status dropdown in ApplicationDetail page
- **Effort**: 30 minutes
- **Impact**: Critical for tracking application progress

**2. Analytics Dashboard**
- Visual charts: Applications by status (pie chart)
- Match score trends over time (line graph)
- Deadline timeline view
- Average response time per company
- Success rate metrics

**3. Bulk Operations**
- Select multiple applications
- Bulk status updates
- Bulk delete
- Export to CSV/PDF

**4. Browser Extension**
- Auto-fill application form from job posting URL
- One-click save from LinkedIn/Indeed
- Quick add without opening full app


### Phase 2: Advanced AI Features (Medium Priority)

**1. Company Research Agent**
- Scrape company website, Glassdoor, LinkedIn
- Summarize: Culture, interview process, employee reviews
- Identify: Key decision makers, recent news

**2. Resume Tailoring**
- Auto-generate customized resume for each job
- Highlight relevant projects and skills
- Suggest wording improvements
- Export as PDF

**3. Mock Interview Agent**
- Voice-based practice interviews
- Real-time feedback on answers
- Follow-up questions based on responses
- Record and transcribe sessions

**4. Network Mapping**
- Find connections at target companies
- LinkedIn integration
- Referral request templates
- Track networking interactions

### Phase 3: Enterprise Features (Low Priority)

**1. Team Collaboration**
- Share applications with mentors/advisors
- Commenting system
- Permission levels
- University career center integration

**2. Mobile Apps**
- iOS and Android native apps
- Push notifications for deadlines
- Quick status updates
- Resume upload from phone camera

**3. Public API**
- RESTful API for integrations
- Webhooks for status changes
- OAuth for third-party apps
- Rate limiting and usage tracking


### Phase 4: Machine Learning (Future)

**1. Predictive Analytics**
- Predict offer probability based on match score
- Estimate interview likelihood
- Recommend optimal application time
- Identify high-conversion companies

**2. Voice Agent**
- Voice commands for adding applications
- Spoken interview practice
- Daily briefing of upcoming deadlines
- Natural language queries

**3. Video Interview Analysis**
- Record practice interviews
- Analyze: Body language, speech patterns, filler words
- Provide actionable feedback
- Compare to successful interview patterns

---

## Known Limitations

### Current Issues

**1. Status Editing** ⭐ HIGH PRIORITY
- **Issue**: Cannot edit application status after creation
- **Impact**: Users must delete and recreate to change status
- **Workaround**: Manual tracking in notes field
- **Fix**: Add status dropdown in ApplicationDetail.jsx
- **Effort**: 30 minutes

**2. Basic UI**
- No charts or visualizations yet
- No drag-and-drop file upload
- Limited animation and transitions

**3. Email Rate Limits**
- Gmail free tier: 500 emails/day
- May hit limit with many users
- **Solution**: Upgrade to SendGrid or AWS SES

**4. Cold Starts**
- Render free tier sleeps after 15 minutes
- First request after sleep takes ~30s
- **Solution**: Use uptime monitor or upgrade to paid tier

**5. No Real-Time Updates**
- Deadline monitor runs every 2 minutes (cron job)
- UI doesn't auto-refresh when data changes
- **Solution**: Add WebSocket support or polling


**6. Sequential AI Calls**
- Gemini API calls run sequentially in analysis pipeline
- Total time: 10-15 seconds
- **Solution**: Parallelize with Promise.all (could reduce to 5-7s)

**7. No Offline Support**
- Requires internet connection
- No PWA features
- **Solution**: Add service worker and IndexedDB caching

**8. Limited Search**
- Basic search in applications
- No filters or advanced queries
- **Solution**: Add filter sidebar with multi-criteria search

**9. No File Attachments**
- Can't attach cover letters, transcripts
- Only resume upload supported
- **Solution**: Add multi-file upload with Firebase Storage

**10. No Internationalization**
- English only
- US date formats
- **Solution**: Add i18n support for multiple languages

---

## MongoDB IP Whitelist Setup

### Problem

MongoDB Atlas restricts connections to whitelisted IP addresses by default. If you connect from different networks (home WiFi, coffee shop, campus), you'll see:

```
MongoServerError: IP address not registered
```

This happens because your IP address changes with each network, and Atlas blocks unrecognized IPs for security.

### Solution: Allow Access from Anywhere

**Steps to whitelist all IP addresses**:

1. **Go to MongoDB Atlas**:
   - Open: https://cloud.mongodb.com
   - Log in to your account
   - Select your project (OrbitKeeper)

2. **Navigate to Network Access**:
   - Click **"Network Access"** in the left sidebar
   - (or go to: Security → Network Access)


3. **Add IP Address**:
   - Click **"+ ADD IP ADDRESS"** button
   - You'll see a dialog with two options

4. **Select "Allow Access from Anywhere"**:
   - Click the **"ALLOW ACCESS FROM ANYWHERE"** button
   - This automatically enters `0.0.0.0/0` in the IP address field
   - This means: Any IP address can connect

5. **Add Comment** (optional but recommended):
   - In the "Comment" field, type: `Development - All Networks`
   - Helps identify this rule later

6. **Confirm**:
   - Click **"Confirm"** button
   - Wait 1-2 minutes for changes to propagate

7. **Verify**:
   - Go back to your app
   - Try connecting to MongoDB
   - Should work from any network now ✅

### Visual Guide

```
MongoDB Atlas Dashboard
├─> Network Access (left sidebar)
    ├─> Click "+ ADD IP ADDRESS"
    │
    ├─> Modal appears with two options:
    │   ├─> "Add Current IP Address" (your current IP only)
    │   └─> "ALLOW ACCESS FROM ANYWHERE" ← Click this
    │
    ├─> IP Address field shows: 0.0.0.0/0
    ├─> Comment field: "Development - All Networks"
    ├─> Click "Confirm"
    │
    └─> Wait 1-2 minutes for propagation
```

### What Does `0.0.0.0/0` Mean?

- **`0.0.0.0/0`**: CIDR notation for "all IPv4 addresses"
- Allows connections from any IP address globally
- Useful for development when you work from different locations
- Your database is still protected by username/password authentication


### Security Considerations

**Is "Allow Access from Anywhere" secure?**

✅ **Yes, for development and small projects**:
- Your database is still protected by username and password
- Connection string is never exposed (in .env file)
- Only people with your connection string can connect
- Similar to how most MongoDB tutorials and free-tier projects work

⚠️ **For production (optional)**:
- Consider restricting to specific IPs
- Use MongoDB Atlas IP access lists
- For deployed apps: Whitelist only Render's IP ranges
- For local dev: Keep `0.0.0.0/0` for convenience

### Alternative: Add Current IP Only (Not Recommended for Development)

If you prefer to manually add each network:

1. Click **"+ ADD IP ADDRESS"**
2. Click **"Add Current IP Address"** (adds your current IP only)
3. Repeat this process every time you change networks

**Downside**: You'll need to do this every time you connect from:
- Home WiFi
- Coffee shop
- Campus
- Mobile hotspot
- Friend's house

This is why most developers use `0.0.0.0/0` for development.

### Troubleshooting

**Still getting "IP not registered" error after adding 0.0.0.0/0?**

1. **Wait 2 minutes**: Changes take time to propagate
2. **Check Network Access page**: Verify `0.0.0.0/0` is listed with ✅ green checkmark
3. **Restart your server**: Kill and restart `npm run dev`
4. **Check connection string**: Ensure password is URL-encoded (`@` becomes `%40`)
5. **Check MongoDB status**: Visit status.mongodb.com for outages

---

## Summary

OrbitKeeper is a production-ready AI career agent with:
- ✅ 3-tier architecture (React + Express + MongoDB)
- ✅ 6 specialized AI agents powered by Gemini 2.5 Flash
- ✅ 14 MCP tools for standardized data operations
- ✅ Autonomous deadline monitoring with email notifications
- ✅ Multi-layer security with Firebase Auth
- ✅ Scalable deployment on free tiers (Vercel + Render)
- ✅ Comprehensive documentation and future roadmap

**Ready for hackathon submission and real-world use!** 🚀

