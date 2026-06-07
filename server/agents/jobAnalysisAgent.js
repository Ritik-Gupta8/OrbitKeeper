/**
 * Job Analysis Agent
 * 
 * Analyzes a job description using Gemini and extracts structured information.
 * Identifies company, role, required/preferred skills, deadline, and generates a summary.
 */

import { generateJSON } from '../utils/gemini.js';

export const analyzeJobDescription = async (jobDescription, companyHint = '') => {
  const prompt = `
You are an expert career advisor analyzing a job/internship posting.

Extract structured information from the following job description.
${companyHint ? `Company hint: ${companyHint}` : ''}

Job Description:
"""
${jobDescription}
"""

Return a JSON object with this exact structure:
{
  "company": "Company name (extract from JD or use hint)",
  "role": "Job title/role name",
  "location": "Location or 'Remote' or 'Hybrid'",
  "jobType": "internship | full-time | part-time | contract",
  "deadline": "Deadline date in ISO format if mentioned, otherwise null",
  "experienceRequired": "e.g. '0-1 years' or 'No experience required'",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "benefits": ["benefit1", "benefit2"],
  "summary": "2-3 sentence summary of the opportunity for a student"
}

Rules:
- requiredSkills: skills explicitly marked as required/must-have
- preferredSkills: skills marked as nice-to-have/preferred/bonus
- Keep arrays concise (max 8 items each)
- If information is not present, use empty array [] or null
`;

  const result = await generateJSON(prompt);
  return result;
};
