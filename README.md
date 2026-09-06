<div align="center">

<img src="client/public/favicon.png" alt="OrbitKeeper Logo" width="90" height="90" />

# 🚀 OrbitKeeper

### The Autonomous AI Career Agent that doesn't just answer — it _acts_.

**Plan. Reason. Execute.** OrbitKeeper turns the chaos of job hunting into an autonomous, multi-agent workflow — analyzing job fit, closing skill gaps, prepping interviews, and guarding every deadline, all on its own.

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-orbitkeeper.vercel.app-6366f1?style=for-the-badge)](https://orbitkeeper.vercel.app)


<br/>

[![Built on Google Agent Platform](https://img.shields.io/badge/Built_on-Google_Agent_Platform-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Gemini 3.5 Flash](https://img.shields.io/badge/Gemini-3.5_Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://cloud.google.com/vertex-ai)
[![MongoDB MCP](https://img.shields.io/badge/MongoDB-MCP_Server-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![MCP Official SDK](https://img.shields.io/badge/MCP-Official_SDK-A259FF?style=flat-square)](https://modelcontextprotocol.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

**🏆 Built for the Google Cloud Agent Builder Hackathon · MongoDB Partner Track**

`#AIAgents` · `#GoogleAgentPlatform` · `#GeminiAI` · `#MongoDBMCP` · `#MultiAgentSystem` · `#AgenticAI`

</div>

---

## 🧭 Table of Contents

- [⚡ TL;DR](#-tldr)
- [🎯 The Problem](#-the-problem)
- [💡 The Solution](#-the-solution)
- [🤖 Built on Google Agent Platform](#-built-on-google-agent-platform)
- [🧠 The Multi-Agent System](#-the-multi-agent-system)
- [🦾 The MCP Superpower](#-the-mcp-superpower)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture at a Glance](#️-architecture-at-a-glance)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🔐 Security](#-security)
- [📊 Project Stats](#-project-stats)
- [🎥 Demo](#-demo)
- [📄 License](#-license)
- [👥 Team](#-team)

---

## ⚡ TL;DR

> **OrbitKeeper is an agentic AI career copilot and secure Personal Gemini Journal.** Paste a job description, and a team of specialized Gemini-powered agents springs into action — scoring your fit, mapping your skill gaps, drafting a prep plan, generating interview questions, reflecting on your career journey in a user-isolated Firestore journal, and autonomously emailing you before every deadline. It is built on **Google Agent Platform (Vertex AI)** with **Gemini 3.5 Flash**, uses a real **MongoDB MCP server** for structured career applications, and leverages **Google Cloud Firestore** for user-isolated conversation logging and reflection memory.

| | |
|---|---|
| 🤖 **6 autonomous agents** | reason and execute multi-step career tasks |
| 🔌 **14 MongoDB MCP tools** | standardized, auditable agent ↔ career data layer |
| 📓 **Cloud Firestore Journal** | user-isolated multi-turn conversation memory & reflections |
| 🧠 **Gemini 3.5 Flash** | served via Google Agent Platform (Vertex AI) |
| 🔒 **Secret Manager & Zero-Trust** | credentials managed securely; strict server-side UID isolation |
| ⏰ **Autonomous deadline monitor** | runs 24/7, emails you before you miss out |
| 💸 **$0/month** | runs entirely on free tiers (Google Cloud Run + Vercel) |

---

## 🎯 The Problem

Job hunting is overwhelming, and the tools are dumb.

- 📈 Students apply to **50–200+ positions** per cycle.
- 🗂️ Deadlines are scattered across LinkedIn, company portals, and spreadsheets.
- ❓ You have **no idea if you're qualified** until the rejection email arrives.
- ⏳ Great opportunities are **missed** because of poor organization.
- 📄 Generic, untailored applications get **ignored**.
- 🎤 Interview prep is **one-size-fits-none**.

**The result:** wasted time, missed opportunities, and burnout.

---

## 💡 The Solution

OrbitKeeper replaces the spreadsheet with an **agent that takes action on your behalf**. Drop in a job posting and the system autonomously:

1. **Reads & understands** the role (Job Analysis Agent)
2. **Scores your fit 0–100** against your resume (Resume Analysis Agent)
3. **Builds a prioritized prep plan** (Career Planning Agent)
4. **Generates tailored interview questions** (Interview Prep Agent)
5. **Answers your questions** with full context (Career Memory Agent)
6. **Guards your deadlines** and emails you proactively (Deadline Monitoring Agent)

You stay in control; the agents do the legwork.

---

## 🤖 Built on Google Agent Platform

> OrbitKeeper is built on **Google Agent Platform** — Google Cloud's enterprise agent stack (formerly known as Vertex AI). All reasoning is powered by **Gemini 3.5 Flash**, invoked through the Agent Platform's Vertex AI inference layer and orchestrated as a coordinated multi-agent system.

**How OrbitKeeper maps to the Agent Platform building blocks:**

| Agent Platform Capability | OrbitKeeper Implementation |
|---|---|
| **Models** (Gemini) | Gemini 3.5 Flash for all reasoning, planning & generation |
| **Agents** (multi-agent orchestration) | 6 specialized agents coordinated through a controller pipeline |
| **MCP Servers** (external capabilities) | A custom MongoDB MCP server exposing 14 tools |
| **Memory** (long-term context) | Persistent career memory stored in MongoDB Atlas |
| **Tools** (function calling) | Standardized, schema-validated tool calls via the official MCP SDK |

The agents don't just chat — they **reason, plan, call tools, and execute tasks** under user oversight. That is the definition of an agent, and it's what the Agent Platform is built to run.

---

## 🧠 The Multi-Agent System

OrbitKeeper is a true **multi-agent architecture** — each agent owns a single responsibility and coordinates with the others through MCP tools.

```
                          ┌──────────────────────────────┐
                          │   Gemini 3.5 Flash (Vertex)   │
                          │   Google Agent Platform        │
                          └───────────────┬────────────────┘
                                          │ reasoning
        ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
        ▼              ▼                  ▼                  ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  Job         ││  Resume      ││  Career      ││  Interview   ││  Career      │
│  Analysis    ││  Analysis    ││  Planning    ││  Prep        ││  Memory      │
│  Agent       ││  Agent       ││  Agent       ││  Agent       ││  Agent       │
└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘
       │               │               │               │               │
       └───────────────┴───────┬───────┴───────────────┴───────────────┘
                               ▼
                    ┌────────────────────┐       ┌──────────────────────┐
                    │  MongoDB MCP Server │◀──────│ Deadline Monitoring  │
                    │  (14 tools)         │       │ Agent (autonomous)   │
                    └─────────┬───────────┘       └──────────────────────┘
                              ▼
                    ┌────────────────────┐
                    │   MongoDB Atlas     │
                    └────────────────────┘
```

| # | Agent | What it does autonomously |
|---|-------|---------------------------|
| 1 | **Job Analysis Agent** | Extracts required skills, responsibilities, and deadlines from raw job text |
| 2 | **Resume Analysis Agent** | Parses your resume and computes a 0–100 match score with strengths & gaps |
| 3 | **Career Planning Agent** | Generates a prioritized, trackable action plan per application |
| 4 | **Interview Prep Agent** | Crafts technical, behavioral, project & role-specific questions |
| 5 | **Career Memory Agent** | Conversational copilot grounded in your full career data |
| 6 | **Deadline Monitoring Agent** | Runs on a cron schedule and emails 24h/12h reminders — no user action needed |

---

## 🦾 The MCP Superpower

**Model Context Protocol (MCP)** is the open standard that lets AI agents talk to data and tools in a structured, secure, auditable way. OrbitKeeper runs a **real MCP server** built with the official `@modelcontextprotocol/sdk` — this is the MongoDB partner-track integration and the backbone of the whole system.

**Without MCP** ❌ agents are hard-wired to the database, untestable, and impossible to audit.
**With MCP** ✅ agents focus purely on reasoning while a standardized tool layer handles all data access.

<details>
<summary><b>🔧 The 14 MCP Tools (click to expand)</b></summary>

**Generic database operations**
1. `find_documents` — query collections with filters
2. `insert_document` — create documents
3. `update_document` — update documents
4. `delete_document` — remove documents
5. `aggregate` — run aggregation pipelines
6. `list_collections` — discover collections

**Career-specific operations**
7. `store_ai_analysis` — persist AI analysis results
8. `get_upcoming_deadlines` — find approaching deadlines
9. `get_dashboard_stats` — compute dashboard metrics
10. `mark_reminder_sent` — track reminder state
11. `log_notification` — email audit trail
12. `get_profile` — fetch profile (with replication-lag retry logic)
13. `update_profile` — update profile while preserving resume text
14. `search_applications` — full-text search

</details>

> **No direct database imports anywhere in the agent code. Pure MCP. That's the superpower.**

---

## ✨ Key Features
 
| | Feature | Description |
|---|---|---|
| 📊 | **Match Score Dashboard** | See how qualified you are at a glance, 0–100 |
| 📝 | **AI Resume Parser** | Upload once — skills, projects & experience auto-extracted |
| 🎯 | **Skill Gap Analysis** | Know exactly what to learn before you apply |
| 🗺️ | **AI Action Plans** | Prioritized, trackable prep tasks per role |
| 🎤 | **Interview Question Generator** | Role-specific technical, behavioral & project questions |
| ⏰ | **Autonomous Deadline Agent** | 24/7 cron job emails you 24h & 12h before deadlines |
| 📓 | **Personal AI Career Journal** | Multi-turn career conversations persisted to Google Cloud Firestore |
| 💡 | **AI Career Reflection** | Auto-extracts summaries, key takeaways & next action steps per interaction |
| 🛡️ | **Zero-Trust UID Isolation** | Verified server-side Firebase UID token scoping + matching `firestore.rules` |
| 🔐 | **Google Secret Manager** | Secure production secrets handling with zero hardcoded credentials |
| 🎨 | **Modern Animated UI** | Glassmorphic React + Tailwind interface |
 
---
 
## 🏗️ Architecture at a Glance
 
```
┌───────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Client)                                              │
│  - React 18 SPA on Vercel · Tailwind CSS · Glassmorphic UI                │
│  - Firebase Auth (Google OAuth 2.0)                                       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTPS + Verified Bearer JWT
┌─────────────────────────────────────▼─────────────────────────────────────┐
│  APPLICATION LAYER (Google Cloud Run / Express Server)                    │
│  - Firebase Admin Token Verification (req.user.uid)                       │
│  - 6 AI Agents (Gemini 3.5 Flash via Vertex AI)                           │
│  - MCP Server (14 Tools) + MCP Client with resilient direct fallback      │
│  - Google Cloud Secret Manager integration (zero hardcoded keys)          │
│  - Autonomous Deadline Monitor (node-cron + Nodemailer)                   │
└───────────────────┬───────────────────────────────────┬───────────────────┘
                    │ MCP Protocol                      │ Firebase Admin
┌───────────────────▼───────────────┐   ┌───────────────▼───────────────────┐
│  MONGODB ATLAS (CAREER DATA STORE)│   │  GOOGLE CLOUD FIRESTORE (JOURNAL) │
│  - Applications & Match Scores    │   │  - Isolated User Conversations    │
│  - User Profiles & Parsed Resumes │   │  - AI Reflections & Action Plans  │
│  - Notification Audit Logs        │   │  - Path: users/{uid}/journalEntries│
└───────────────────────────────────┘   └───────────────────────────────────┘
```
 
📐 **Full technical deep-dive:** [ARCHITECTURE.md](ARCHITECTURE.md)
 
---
 
## 🛠️ Tech Stack
 
<div align="center">
 
| Layer | Technologies |
|-------|-------------|
| **AI / Reasoning** | Google Agent Platform · Vertex AI · Gemini 3.5 Flash · Official MCP SDK |
| **Frontend** | React 18 · React Router v6 · Tailwind CSS · Vite · Recharts · Lucide |
| **Backend** | Node.js (ES Modules) · Express · Mongoose · node-cron · Nodemailer |
| **Data & Auth** | MongoDB Atlas (Career Records) · Cloud Firestore (Journal) · Firebase Auth |
| **Security & Secrets** | Google Cloud Secret Manager · UID-Scoped Access · Firebase Admin SDK |
| **Hosting** | Vercel (frontend) · Google Cloud Run (backend container) — $0/month |
 
</div>

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier)
- Google Cloud project with Vertex AI / Agent Platform enabled
- Firebase project with Google OAuth
- A Gmail account (for the deadline reminder sender)

### 1. Clone
```bash
git clone https://github.com/Ritik-Gupta8/OrbitKeeper.git
cd OrbitKeeper
```

### 2. Install
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment

<details>
<summary><b>Backend — <code>server/.env</code></b></summary>

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Google Agent Platform / Vertex AI
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_CLOUD_MODEL=gemini-3.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

CLIENT_URL=http://localhost:5173
```
</details>

<details>
<summary><b>Frontend — <code>client/.env</code></b></summary>

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```
</details>

### 4. Run
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🔐 Security & Cloud Architecture

- ✅ **Google Cloud Secret Manager**: Automated retrieval of production credentials with in-memory caching and zero plaintext secrets.
- ✅ **Zero-Trust UID Isolation**: Strict server-side verification using Firebase Admin SDK (`req.user.uid`). No client-supplied UIDs accepted.
- ✅ **Dual Database Security**: MongoDB Atlas queries strictly scoped by `userId`; Firestore journal entries partitioned under `users/{uid}/journalEntries` with matching `firestore.rules`.
- ✅ **Google Cloud Run Deployment**: Stateless, containerized backend running on Cloud Run with non-root security context and dynamic port binding.
- ✅ **Firebase Authentication**: Google OAuth 2.0 integration with verified short-lived JWT Bearer tokens on all protected endpoints.
- ✅ **TLS & Network Isolation**: Full TLS/SSL encryption for MongoDB Atlas, Firestore, and Vertex AI API traffic.
- ✅ **Strict Input Validation**: Mongoose schemas and Zod validation across all MCP tools and REST endpoints.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| 🤖 AI Agents | 6 specialized agents |
| 🔌 MCP Tools | 14 MongoDB operations |
| 🧠 Model | Gemini 3.5 Flash (Agent Platform) |
| 👥 Team | 2 developers |
| 💸 Running cost | $0 / month |

---

## 🎥 Demo

- 🌐 **Live App:** [orbitkeeper.vercel.app](https://orbitkeeper.vercel.app)
- ▶️ **Video walkthrough:** _add your YouTube/Loom link here_

---

## 📄 License

Released under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 👥 Team

| Developer | Contact |
|-----------|---------|
| **Ritik Gupta** | [GitHub](https://github.com/Ritik-Gupta8) · porwal2000ritik@gmail.com |
| **Yashovardhan Thopte** | [GitHub](https://github.com/yash0238) · www.yyaasshh@gmail.com |

---

<div align="center">

**⭐ Built with Gemini's brain, MongoDB's memory, and Google Agent Platform's muscle.**

_Google Cloud Agent Builder Hackathon · MongoDB Partner Track_

`#GoogleAgentPlatform` · `#GeminiAI` · `#MongoDBMCP` · `#AgenticAI` · `#Hackathon2026`

</div>
