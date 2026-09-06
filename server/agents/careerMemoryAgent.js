/**
 * Career Memory Agent
 *
 * Retrieves stored career data via MCP tools and passes it as context
 * to Gemini to answer career-related questions.
 *
 * MCP tools used:
 *   - find_documents  (applications collection)
 *   - get_profile
 */

import { generateText, generateJSON } from '../utils/gemini.js';
import mcpClient from '../mcp/mcpClient.js';
import { getJournalHistory, saveJournalEntry } from '../utils/firestoreJournal.js';

export const answerCareerQuestion = async (question, userId = 'default', sessionId = 'default') => {
  // ── MCP Tool calls + Firestore Journal History ────────────────────────────
  // Concurrently fetch career memory from MongoDB (via MCP) and conversation history (from Firestore)
  const [appsResult, profileResult, history] = await Promise.all([
    mcpClient.callTool('find_documents', {
      collection: 'applications',
      filter:     { userId },
      sort:       { createdAt: -1 },
      limit:      20,
    }).catch(err => {
      console.warn('[CareerMemory] MCP find_documents fallback:', err.message);
      return { documents: [] };
    }),
    mcpClient.callTool('get_profile', { userId }).catch(err => {
      console.warn('[CareerMemory] MCP get_profile fallback:', err.message);
      return { profile: {} };
    }),
    getJournalHistory(userId, 8).catch(err => {
      console.warn('[CareerMemory] Firestore getJournalHistory fallback:', err.message);
      return [];
    }),
  ]);

  const applications = appsResult.documents  || [];
  const profile      = profileResult.profile || {};

  // ── Build memory context ──────────────────────────────────────────────────
  const memoryContext = buildMemoryContext(applications, profile);
  const conversationContext = buildConversationContext(history);

  const prompt = `
You are OrbitKeeper, an intelligent AI career copilot with access to a student's career records in MongoDB and their personal journal in Firestore.

CURRENT CAREER MEMORY (retrieved via MongoDB MCP):
${memoryContext}

${conversationContext ? `RECENT CONVERSATION HISTORY (from personal AI journal):\n${conversationContext}\n` : ''}
CURRENT USER QUESTION: "${question}"

Provide a helpful, specific, and actionable response.
Reference previous messages from the conversation or specific companies, scores, or skills when relevant.
Keep your response concise and structured. Use bullet points where helpful.
`;

  const answer = await generateText(prompt);

  // ── Phase 8 Feature: AI Career Reflection & Summary ───────────────────────
  // Generate reflection asynchronously; fallback safely if AI summary fails
  let reflection = { summary: null, keyDecision: null, nextAction: null };
  try {
    const summaryPrompt = `
Analyze this user query and assistant response from a career advising session:
User Question: "${question}"
Assistant Answer: "${answer.substring(0, 800)}"

Return a JSON object with:
{
  "summary": "1-2 sentence concise summary of this interaction",
  "keyDecision": "Key takeaway or decision made, or null if none",
  "nextAction": "1 clear next action step for the user to take"
}
`;
    reflection = await generateJSON(summaryPrompt);
  } catch (summaryErr) {
    console.warn('[CareerMemory] Reflection generation fallback:', summaryErr.message);
    reflection = {
      summary: question.length > 80 ? question.substring(0, 77) + '...' : question,
      keyDecision: null,
      nextAction: null,
    };
  }

  // ── Persist to Firestore Journal (Non-blocking) ───────────────────────────
  saveJournalEntry(userId, {
    sessionId,
    userMessage: question,
    assistantResponse: answer,
    summary: reflection.summary,
    keyDecision: reflection.keyDecision,
    nextAction: reflection.nextAction,
  }).catch(saveErr => {
    console.warn('[CareerMemory] Firestore journal save failed:', saveErr.message);
  });

  return {
    answer,
    reflection,
    applicationsUsed: applications.length,
    historyTurnsUsed: history.length,
  };
};

const buildConversationContext = (history = []) => {
  if (!history || history.length === 0) return '';
  // Chronological order (oldest to newest for prompt)
  const chronological = [...history].reverse();
  return chronological
    .map(entry => `User: ${entry.userMessage}\nAssistant: ${entry.assistantResponse}`)
    .join('\n\n');
};

const buildMemoryContext = (applications, profile) => {
  const sections = [];

  if (profile.name) {
    sections.push(`STUDENT: ${profile.name}`);
    sections.push(`SKILLS: ${profile.skills?.join(', ') || 'Not set'}`);
    sections.push(`CAREER GOALS: ${profile.careerGoals || 'Not set'}`);
  }

  if (applications.length > 0) {
    sections.push(`\nAPPLICATIONS (${applications.length} total):`);
    applications.forEach(app => {
      sections.push(
        `- ${app.company} | ${app.role} | Status: ${app.status} | ` +
        `Match: ${app.matchScore}% | ` +
        `${app.deadline ? `Deadline: ${new Date(app.deadline).toLocaleDateString()}` : 'No deadline'}`
      );
      if (app.missingSkills?.length > 0) {
        sections.push(`  Missing skills: ${app.missingSkills.join(', ')}`);
      }
      if (app.interviewDate) {
        sections.push(`  Interview date: ${new Date(app.interviewDate).toLocaleDateString()}`);
      }
    });
  } else {
    sections.push('No applications tracked yet.');
  }

  return sections.join('\n');
};
