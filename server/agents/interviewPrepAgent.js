/**
 * Interview Preparation Agent
 * 
 * Generates personalized interview questions based on the job description,
 * the student's resume, and the specific company/role.
 */

import { generateJSON } from '../utils/gemini.js';

export const generateInterviewQuestions = async ({ role, company, jobDescription, resumeText, requiredSkills }) => {
  const prompt = `
You are an expert technical interviewer and career coach.

Generate personalized interview questions for this student applying to:
- Role: ${role}
- Company: ${company}
- Key Skills Required: ${requiredSkills?.join(', ') || 'Not specified'}

JOB DESCRIPTION CONTEXT:
"""
${jobDescription?.substring(0, 1000) || 'Not provided'}
"""

STUDENT RESUME SUMMARY:
"""
${resumeText?.substring(0, 1000) || 'Not provided'}
"""

Return a JSON object:
{
  "technical": [
    {
      "question": "Technical question text",
      "hint": "What a good answer should cover",
      "difficulty": "easy | medium | hard"
    }
  ],
  "behavioral": [
    {
      "question": "Behavioral question using STAR format",
      "hint": "Key points to address",
      "framework": "STAR"
    }
  ],
  "projectBased": [
    {
      "question": "Question about their projects",
      "hint": "What to highlight"
    }
  ],
  "resumeBased": [
    {
      "question": "Question based on resume content",
      "hint": "Context for answering"
    }
  ],
  "roleSpecific": [
    {
      "question": "Company/role-specific question",
      "hint": "Research tip or answer approach"
    }
  ],
  "preparationTips": [
    "Specific tip 1",
    "Specific tip 2",
    "Specific tip 3"
  ]
}

Rules:
- technical: 5 questions specific to the role's tech stack
- behavioral: 4 STAR-format questions
- projectBased: 3 questions referencing their actual projects if available
- resumeBased: 3 questions about resume highlights
- roleSpecific: 3 questions specific to ${company}'s culture/role
- Make questions realistic and challenging but fair for an intern level
`;

  const result = await generateJSON(prompt);
  return result;
};
