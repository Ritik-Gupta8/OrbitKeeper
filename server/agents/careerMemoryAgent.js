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

import { generateText } from '../utils/gemini.js';
import mcpClient from '../mcp/mcpClient.js';

export const answerCareerQuestion = async (question, userId = 'default') => {
  // ── MCP Tool calls ────────────────────────────────────────────────────────
  // Fetch career memory from MongoDB through the MCP protocol
  const [appsResult, profileResult] = await Promise.all([
    mcpClient.callTool('find_documents', {
      collection: 'applications',
      filter:     { userId },
      sort:       { createdAt: -1 },
      limit:      20,
    }),
    mcpClient.callTool('get_profile', { userId }),
  ]);

  const applications = appsResult.documents  || [];
  const profile      = profileResult.profile || {};

  // ── Build memory context ──────────────────────────────────────────────────
  const memoryContext = buildMemoryContext(applications, profile);

  const prompt = `
You are OrbitKeeper, an AI career agent with access to a student's complete career history stored in MongoDB.

STUDENT CAREER MEMORY (retrieved via MongoDB MCP):
${memoryContext}

STUDENT QUESTION: "${question}"

Provide a helpful, specific, and actionable answer based on their actual stored data.
Reference specific companies, roles, scores, or skills from their history when relevant.
Keep your response concise but complete. Use bullet points where helpful.
`;

  const answer = await generateText(prompt);
  return { answer, applicationsUsed: applications.length };
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
