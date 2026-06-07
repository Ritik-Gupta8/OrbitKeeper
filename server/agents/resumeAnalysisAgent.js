/**
 * Resume Analysis Agent
 * 
 * Analyzes a resume against a job description using Gemini.
 * Computes a match score, identifies strengths/weaknesses, and suggests improvements.
 */

import { generateJSON } from '../utils/gemini.js';

export const analyzeResumeAgainstJob = async (resumeText, jobDescription, jobSummary = {}) => {
  const requiredSkills = jobSummary.requiredSkills?.join(', ') || 'Not specified';
  const preferredSkills = jobSummary.preferredSkills?.join(', ') || 'Not specified';

  const prompt = `
You are an elite resume reviewer and career coach.

Analyze this resume against the job requirements and provide a detailed assessment.

RESUME:
"""
${resumeText}
"""

JOB TITLE: ${jobSummary.role || 'Software Intern'}
COMPANY: ${jobSummary.company || 'Unknown'}
REQUIRED SKILLS: ${requiredSkills}
PREFERRED SKILLS: ${preferredSkills}

JOB DESCRIPTION:
"""
${jobDescription}
"""

Return a JSON object with this exact structure:
{
  "matchScore": 75,
  "matchLevel": "Strong Match | Good Match | Moderate Match | Weak Match",
  "strengthAreas": ["strength1", "strength2", "strength3"],
  "weaknessAreas": ["weakness1", "weakness2"],
  "missingSkills": ["skill1", "skill2"],
  "presentSkills": ["skill1", "skill2"],
  "improvementSuggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2",
    "Specific actionable suggestion 3"
  ],
  "resumeHighlights": {
    "skills": ["extracted skill1", "extracted skill2"],
    "experience": ["experience highlight 1"],
    "education": "Degree, University",
    "projects": ["project 1", "project 2"]
  },
  "overallFeedback": "2-3 sentence overall assessment"
}

Rules:
- matchScore: 0-100 integer based on how well the resume matches the job
- Be specific and actionable in suggestions
- Base matchLevel on score: 80-100=Strong, 60-79=Good, 40-59=Moderate, 0-39=Weak
- missingSkills: skills required by job but absent in resume
- presentSkills: required skills found in resume
`;

  const result = await generateJSON(prompt);
  return result;
};

/**
 * Extract resume information from raw text
 */
export const extractResumeInfo = async (resumeText) => {
  const prompt = `
You are a resume parser. Extract structured information from this resume text.

RESUME:
"""
${resumeText}
"""

Return a JSON object:
{
  "name": "Full name",
  "email": "email@example.com",
  "phone": "phone number",
  "skills": ["skill1", "skill2"],
  "programmingLanguages": ["Python", "JavaScript"],
  "frameworks": ["React", "Node.js"],
  "tools": ["Git", "Docker"],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.S. Computer Science",
      "field": "Computer Science",
      "year": "2024"
    }
  ],
  "workExperience": [
    {
      "company": "Company",
      "role": "Role",
      "duration": "Jun 2023 - Aug 2023",
      "description": "What they did"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "techStack": ["React", "Node.js"],
      "url": "github.com/..."
    }
  ]
}
`;

  const result = await generateJSON(prompt);
  return result;
};
