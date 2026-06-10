# 🚀 OrbitKeeper - AI Career Agent

> **Your AI-powered career companion for internship and job applications**

Built for the **Google Cloud Agent Builder Hackathon** (MongoDB Partner Track) using the code-first approach via Google Cloud Vertex AI SDK with Gemini 2.5 Flash and the official `@modelcontextprotocol/sdk`.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5%20Flash-orange)](https://cloud.google.com/vertex-ai)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)
[![MCP](https://img.shields.io/badge/MCP-Official%20SDK-purple)](https://modelcontextprotocol.io/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [MCP "Superpower"](#mcp-superpower)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Demo](#demo)
- [License](#license)

---

## 🎯 Overview

**OrbitKeeper** is an intelligent career agent that helps students and job seekers manage their internship/job applications with AI-powered insights, deadline monitoring, and personalized career guidance.

**Built with**:
- ✅ **Google Cloud Agent Builder** via Vertex AI SDK (code-first approach)
- ✅ **Gemini 2.5 Flash** for advanced reasoning and planning
- ✅ **MongoDB Atlas** + **Official MCP SDK** for intelligent data operations
- ✅ **Firebase Authentication** for secure multi-user access
- ✅ **Real-time email notifications** for deadline reminders

**What makes it special**: OrbitKeeper doesn't just answer questions—it actively manages your career pipeline, analyzes job postings, calculates your match score, identifies skill gaps, generates tailored action plans, creates interview questions, and proactively sends deadline reminders.

---

## 🔴 The Problem

Job hunting is overwhelming:
- **Students apply to 50-200+ positions** per cycle
- **Track deadlines** across multiple platforms (LinkedIn, company websites, etc.)
- **No idea if they're qualified** until after rejection
- **Miss deadlines** due to poor organization
- **Generic applications** lead to low response rates
- **Lack personalized interview prep** for each role

**Result**: Wasted time, missed opportunities, and low success rates.

---

## 💡 Our Solution

**OrbitKeeper** is an AI agent that solves these pain points through intelligent automation:

### 1️⃣ **Smart Application Tracking**
- Centralized dashboard for all applications
- Status tracking: Saved → Applied → Interview → Offer
- Notes and company research in one place

### 2️⃣ **AI-Powered Match Analysis** (Gemini 2.5 Flash)
- **Upload your resume once** → AI parses skills, projects, experience
- **Paste job description** → AI analyzes requirements
- **Get match score (0-100)** based on your qualifications
- **See strength areas** where you excel
- **Identify missing skills** you need to learn
- **Receive improvement suggestions** tailored to the role

### 3️⃣ **Personalized Career Planning** (Gemini 2.5 Flash)
- **7-task action plan** generated for each application
- Prioritized tasks (High/Medium/Low)
- Skills to learn, projects to build, areas to strengthen
- Track completion as you prepare

### 4️⃣ **Interview Preparation** (Gemini 2.5 Flash)
- **Role-specific questions** based on job description
- **Technical questions** aligned with required skills
- **Behavioral questions** for culture fit
- **Resume-based questions** about your experience
- **Project-based questions** to discuss your work

### 5️⃣ **Deadline Monitoring Agent** (Autonomous Cron Job)
- **Runs every 2 minutes** checking upcoming deadlines
- **24h reminder** when deadline is 20-24 hours away
- **12h reminder** when deadline is 10-12 hours away
- **Fetches user email from Firebase** (Google OAuth)
- **Sends styled HTML emails** with countdown timer
- **Only reminds for saved applications** (not already applied)

### 6️⃣ **Conversational Career Copilot** (Gemini 2.5 Flash)
- Ask questions about your applications
- Get career advice based on your profile
- Discuss specific companies or roles
- Context-aware conversations with memory

---

## ✨ Key Features

### For Students/Job Seekers:
- 📊 **Match Score Dashboard** - See how qualified you are at a glance
- 📝 **Resume Parser** - Upload once, use everywhere
- 🎯 **Skill Gap Analysis** - Know exactly what to learn
- 📅 **Deadline Tracking** - Never miss an application deadline
- 📧 **Email Reminders** - Automated 24h and 12h alerts
- 🤖 **AI Career Copilot** - Get personalized advice anytime
- 💪 **Action Plans** - Step-by-step preparation for each role
- 🎤 **Interview Questions** - Practice with role-specific questions

### For Developers:
- 🔐 **Firebase Authentication** - Secure Google OAuth
- 🗄️ **MongoDB MCP Integration** - 14 custom tools via official SDK
- 🤖 **6 AI Agents** - Specialized agents for different tasks
- ⚡ **Vertex AI Gemini 2.5 Flash** - Latest model via GCP 
- 📨 **Gmail SMTP** - Email notifications via nodemailer
- 🔄 **Cron Jobs** - Autonomous deadline monitoring
- 🎨 **Modern UI** - React + Tailwind CSS

---

### Component Breakdown:

**Frontend** (`client/`):
- React 18 with React Router v6
- Tailwind CSS for styling
- Firebase SDK for authentication
- Axios for API calls
- Context API for user state

**Backend** (`server/`):
- Express.js REST API
- Firebase Admin SDK for token verification
- MCP Server with 14 registered tools
- 6 specialized AI agents
- Node-cron for deadline monitoring
- Nodemailer for email notifications

**Database** (MongoDB Atlas):
- `applications` collection - Job applications with AI analysis
- `profiles` collection - User profiles with resume data
- `notification_logs` collection - Email audit trail

**AI Models** (Google Cloud Vertex AI):
- Gemini 2.5 Flash for all agent reasoning
- GCP credits for API access

---

## 🦾 MCP "Superpower"

**What is MCP?**

Model Context Protocol (MCP) is an open standard that enables AI agents to interact with external data sources and tools in a structured, secure way.

**Why MCP Gives OrbitKeeper "Superpowers":**

### Traditional Approach (Without MCP):
```javascript
//  Direct database imports scattered everywhere
// Each agent needs database knowledge
// Agent logic mixed with data access

```

**Problems**:
- 🔴 Agents are tightly coupled to database schema
- 🔴 No standardization - each agent does its own thing
- 🔴 Hard to test, maintain, and scale
- 🔴 No audit trail or tooling visibility

### MCP Approach (OrbitKeeper):
```
 //  Agents use standardized MCP tools

 // Agent focuses on reasoning, not data access

```

**Benefits**:
- ✅ **Separation of Concerns**: Agents focus on reasoning, tools handle data
- ✅ **Standardized Interface**: All agents use same 14 tools
- ✅ **Easy Testing**: Mock MCP tools without database
- ✅ **Audit Trail**: Every tool call is logged
- ✅ **Scalability**: Add new tools without changing agents
- ✅ **Official SDK**: Using `@modelcontextprotocol/sdk` v1.0.4

### OrbitKeeper's 14 MCP Tools:

#### **Generic Database Operations**:
1. `find_documents` - Query collections with filters
2. `insert_document` - Create new documents
3. `update_document` - Update existing documents
4. `delete_document` - Remove documents
5. `aggregate` - Run aggregation pipelines
6. `list_collections` - Discover available collections

#### **Career-Specific Operations**:
7. `store_ai_analysis` - Save AI analysis results
8. `get_upcoming_deadlines` - Find applications with approaching deadlines
9. `get_dashboard_stats` - Calculate dashboard metrics
10. `mark_reminder_sent` - Track email reminder status
11. `log_notification` - Audit trail for emails
12. `get_profile` - Fetch user profile with retry logic
13. `update_profile` - Update user profile data
14. `search_applications` - Full-text search across applications

**No direct database imports. Pure MCP. This is the "superpower."** 

---

## 🛠️ Tech Stack

### Frontend:
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Firebase SDK** - Authentication
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend:
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **@modelcontextprotocol/sdk** - Official MCP SDK
- **@google-cloud/vertexai** - Gemini AI SDK
- **Firebase Admin** - Auth verification
- **node-cron** - Deadline monitoring
- **Nodemailer** - Email notifications

### Infrastructure:
- **MongoDB Atlas** - Database (Free tier)
- **Google Cloud Vertex AI** - Gemini 2.5 Flash 
- **Firebase Authentication** - Google OAuth
- **Gmail SMTP** - Email delivery
- **Vercel** - Frontend hosting (free)
- **Render** - Backend hosting (free)

---

## 🚀 Getting Started

### Prerequisites:
- Node.js 18+ and npm
- MongoDB Atlas account (free)
- Google Cloud account with Vertex AI enabled
- Firebase project with Google OAuth
- Gmail account for email notifications

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/OrbitKeeper.git
cd OrbitKeeper
```

### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Environment Variables

**Backend** (`server/.env`):
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Google Cloud Vertex AI
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Run Development Servers

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```

**Open**: http://localhost:5173

---


## 📊 Project Stats

- **Lines of Code**: ~5,000
- **AI Agents**: 6 specialized agents
- **MCP Tools**: 14 MongoDB operations
- **Development Time**: Built for hackathon
- **Team Size**: 2 developers
- **Total Cost**: $0/month (using free tiers)

---

## 🔐 Security

**Key Security Features**:
- ✅ All secrets in `.env` (gitignored)
- ✅ Firebase Authentication with Google OAuth
- ✅ JWT token verification on every API call
- ✅ Data isolated by userId
- ✅ MongoDB connection with TLS/SSL
- ✅ CORS restricted to frontend domain
- ✅ Input validation via Mongoose schemas

---

## 📚 Documentation

- [README.md](README.md) - This file
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture & future roadmap

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Cloud** for Vertex AI
- **MongoDB** for Atlas free tier
- **Firebase** for authentication services
- **Model Context Protocol** for the official SDK
- **Open source community** for amazing tools

---

## 📧 Contact

**Developers**: Ritik Gupta , Yashovardhan Thopte
**Email**: porwal2000ritik@gmail.com  
**GitHub**: https://github.com/Ritik-Gupta8  

---

**Built with Brain for the Google Cloud Agent Builder Hackathon (MongoDB Track)**

**#GoogleCloudAgentBuilder #MongoDBMCP #GeminiAI #Hackathon2026**
