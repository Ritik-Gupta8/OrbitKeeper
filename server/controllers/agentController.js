/**
 * Agent Controller
 *
 * Orchestrates AI agent pipelines. All MongoDB operations go through
 * mcpClient → MCP server → toolHandlers → MongoDB.
 *
 * MCP tools called per pipeline:
 *   runFullAnalysis:      find_documents, get_profile, store_ai_analysis
 *   analyzeJob:           (Gemini only, no DB)
 *   getInterviewQuestions: find_documents, get_profile
 *   askCareerAgent:       delegated to careerMemoryAgent (uses MCP internally)
 */

import { analyzeJobDescription }       from '../agents/jobAnalysisAgent.js';
import { analyzeResumeAgainstJob }     from '../agents/resumeAnalysisAgent.js';
import { generateCareerPlan }          from '../agents/careerPlanningAgent.js';
import { generateInterviewQuestions }  from '../agents/interviewPrepAgent.js';
import { answerCareerQuestion }        from '../agents/careerMemoryAgent.js';
import mcpClient                       from '../mcp/mcpClient.js';

// ── Full Analysis Pipeline ────────────────────────────────────────────────────

export const runFullAnalysis = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.headers['x-user-id'] || 'default';

    // ── MCP Tool: find_documents — get the application ─────────────────────
    const appsResult = await mcpClient.callTool('find_documents', {
      collection: 'applications',
      filter:     { _id: applicationId },
      limit:      1,
    });

    const app = appsResult.documents?.[0];
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (!app.jobDescription) {
      return res.status(400).json({ error: 'No job description found. Add one first.' });
    }

    // ── MCP Tool: get_profile — get resume text ────────────────────────────
    const profileResult = await mcpClient.callTool('get_profile', { userId });
    const resumeText    = profileResult.profile?.resumeText || '';

    console.log(`[AgentController] Profile found for userId: ${userId}`);
    console.log(`[AgentController] Resume text length: ${resumeText.length}`);

    if (!resumeText) {
      console.log(`[AgentController] ⚠️  No resume found! Upload resume first.`);
    }

    console.log(`[AgentController] Running full analysis for ${app.company} — ${app.role}`);

    // ── Gemini Agents ──────────────────────────────────────────────────────
    const jobSummary = await analyzeJobDescription(app.jobDescription, app.company);
    console.log(`[Agent] Job analysis done. Skills: ${jobSummary.requiredSkills?.join(', ')}`);

    let resumeAnalysis = null;
    if (resumeText && resumeText.length > 10) {
      resumeAnalysis = await analyzeResumeAgainstJob(resumeText, app.jobDescription, jobSummary);
      console.log(`[Agent] Resume analysis done. Score: ${resumeAnalysis.matchScore}`);
    } else {
      console.log(`[Agent] ⚠️  Skipping resume analysis - no resume text (length: ${resumeText.length})`);
    }

    const careerPlan = await generateCareerPlan({
      resumeText,
      jobSummary,
      missingSkills: resumeAnalysis?.missingSkills || [],
      matchScore:    resumeAnalysis?.matchScore    || 0,
      role:          app.role,
      company:       app.company,
    });
    console.log(`[Agent] Career plan done. Tasks: ${careerPlan.actionPlan?.length}`);

    const interviewQuestions = await generateInterviewQuestions({
      role:           app.role,
      company:        app.company,
      jobDescription: app.jobDescription,
      resumeText,
      requiredSkills: jobSummary.requiredSkills,
    });
    console.log(`[Agent] Interview questions done.`);

    // ── MCP Tool: store_ai_analysis — persist everything to MongoDB ─────────
    const storeResult = await mcpClient.callTool('store_ai_analysis', {
      applicationId,
      analysis: {
        jobSummary,
        matchScore:             resumeAnalysis?.matchScore             || 0,
        strengthAreas:          resumeAnalysis?.strengthAreas          || [],
        weaknessAreas:          resumeAnalysis?.weaknessAreas          || [],
        missingSkills:          resumeAnalysis?.missingSkills          || [],
        improvementSuggestions: resumeAnalysis?.improvementSuggestions || [],
        actionPlan:             careerPlan.actionPlan || [],
        interviewQuestions: {
          technical:    interviewQuestions.technical?.map(q => q.question)    || [],
          behavioral:   interviewQuestions.behavioral?.map(q => q.question)   || [],
          projectBased: interviewQuestions.projectBased?.map(q => q.question) || [],
          resumeBased:  interviewQuestions.resumeBased?.map(q => q.question)  || [],
          roleSpecific: interviewQuestions.roleSpecific?.map(q => q.question) || [],
        },
      },
    });
    console.log(`[Agent] ✅ Analysis stored via MongoDB MCP tool: store_ai_analysis`);

    res.json({
      success: true,
      mcpToolsUsed: ['find_documents', 'get_profile', 'store_ai_analysis'],
      data: {
        jobSummary,
        resumeAnalysis,
        careerPlan,
        interviewQuestions,
        stored:      storeResult.stored,
        application: storeResult.application,
      },
    });
  } catch (error) {
    console.error('[AgentController] Full analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── Job Analysis Only ─────────────────────────────────────────────────────────

export const analyzeJob = async (req, res) => {
  try {
    const { jobDescription, company } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'jobDescription is required' });
    const result = await analyzeJobDescription(jobDescription, company);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Interview Question Generator ──────────────────────────────────────────────

export const getInterviewQuestions = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.headers['x-user-id'] || 'default';

    // ── MCP Tool: find_documents ───────────────────────────────────────────
    const appsResult = await mcpClient.callTool('find_documents', {
      collection: 'applications',
      filter:     { _id: applicationId },
      limit:      1,
    });
    const app = appsResult.documents?.[0];
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // ── MCP Tool: get_profile ──────────────────────────────────────────────
    const profileResult = await mcpClient.callTool('get_profile', { userId });
    const resumeText    = profileResult.profile?.resumeText || '';

    const questions = await generateInterviewQuestions({
      role:           app.role,
      company:        app.company,
      jobDescription: app.jobDescription,
      resumeText,
      requiredSkills: app.jobSummary?.requiredSkills || [],
    });

    res.json({
      success:      true,
      mcpToolsUsed: ['find_documents', 'get_profile'],
      data:         questions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Career Memory Agent ───────────────────────────────────────────────────────

export const askCareerAgent = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.headers['x-user-id'] || 'default';
    if (!question) return res.status(400).json({ error: 'question is required' });

    // careerMemoryAgent uses MCP tools internally: find_documents + get_profile
    const result = await answerCareerQuestion(question, userId);
    res.json({
      success:      true,
      mcpToolsUsed: ['find_documents', 'get_profile'],
      data:         result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
