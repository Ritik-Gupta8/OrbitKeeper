/**
 * Career Planning Agent
 * 
 * Generates a prioritized action plan to help the student
 * close skill gaps and improve their application.
 */

import { generateJSON } from '../utils/gemini.js';

export const generateCareerPlan = async ({ resumeText, jobSummary, missingSkills, matchScore, role, company }) => {
  const prompt = `
You are a strategic career coach helping a student land an internship.

CONTEXT:
- Target Role: ${role} at ${company}
- Current Match Score: ${matchScore}/100
- Missing Skills: ${missingSkills?.join(', ') || 'None identified'}
- Job Requirements: ${jobSummary?.requiredSkills?.join(', ') || 'Not specified'}

STUDENT RESUME SUMMARY:
"""
${resumeText?.substring(0, 1500) || 'Resume not provided'}
"""

Generate a concrete, actionable career plan.

Return a JSON object:
{
  "actionPlan": [
    {
      "task": "Specific actionable task",
      "priority": "high | medium | low",
      "category": "resume | skill | project | networking | application",
      "estimatedTime": "e.g. '2 hours' or '1 week'",
      "completed": false
    }
  ],
  "shortTermGoals": ["Goal 1 (this week)", "Goal 2"],
  "longTermGoals": ["Goal 1 (this month)", "Goal 2"],
  "learningResources": [
    {
      "skill": "Skill to learn",
      "resource": "Specific resource name",
      "type": "course | tutorial | project | book",
      "url": "https://..."
    }
  ],
  "strategicAdvice": "2-3 sentences of strategic advice for this specific application"
}

Rules:
- actionPlan: 5-8 specific tasks, sorted by priority (high first)
- Make tasks SPECIFIC to this job and company
- High priority = needed immediately to improve the application
- Include at least 2 resume improvement tasks
- Include at least 2 skill-building tasks
`;

  const result = await generateJSON(prompt);
  return result;
};
