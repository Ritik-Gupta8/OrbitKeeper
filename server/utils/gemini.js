/**
 * Gemini via @google/genai — Vertex AI mode
 *
 * Uses Google's unified GenAI SDK in Vertex AI mode so all calls are billed
 * against your $1000 Google Cloud credits instead of the AI Studio free tier.
 *
 * Authentication: GOOGLE_APPLICATION_CREDENTIALS (service account JSON).
 * No per-minute free-tier limits apply — full production quota.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT  = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// gemini-2.5-flash works on new GCP projects (2.0/1.5 removed for new projects)
const DEFAULT_MODEL = process.env.GOOGLE_CLOUD_MODEL || 'gemini-2.5-flash';

let _ai = null;

const getAI = () => {
  if (_ai) return _ai;
  if (!PROJECT) throw new Error('GOOGLE_CLOUD_PROJECT is not set in .env');
  _ai = new GoogleGenAI({
    vertexai: true,
    project:  PROJECT,
    location: LOCATION,
  });
  return _ai;
};

// ── Retry helper ──────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const withRetry = async (fn, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isQuota =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');
      if (!isQuota || attempt === maxRetries) throw err;
      const waitMs = attempt * 10000;
      console.warn(`[Gemini] Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }
  throw lastError;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate plain text with Gemini via Vertex AI
 */
export const generateText = async (prompt, modelName = DEFAULT_MODEL) => {
  return withRetry(async () => {
    const ai     = getAI();
    const result = await ai.models.generateContent({
      model:    modelName,
      contents: prompt,
    });
    // @google/genai returns result.text as a string property
    return result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  });
};

/**
 * Generate structured JSON output with Gemini via Vertex AI.
 * Strips markdown fences automatically and parses the result.
 */
export const generateJSON = async (prompt, modelName = DEFAULT_MODEL) => {
  return withRetry(async () => {
    const ai         = getAI();
    const fullPrompt = `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no extra text.`;
    const result     = await ai.models.generateContent({
      model:    modelName,
      contents: fullPrompt,
    });
    const text = (result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    // Strip markdown code blocks if Gemini adds them anyway
    let cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      // Attempt to fix common JSON issues
      console.log('[Gemini] JSON parse failed, attempting repair...');
      
      // Fix unquoted property names (common issue)
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // Fix trailing commas
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
      
      // Remove any trailing incomplete JSON
      const lastValidBrace = Math.max(
        cleaned.lastIndexOf('}'),
        cleaned.lastIndexOf(']')
      );
      if (lastValidBrace > 0) {
        cleaned = cleaned.substring(0, lastValidBrace + 1);
      }
      
      try {
        return JSON.parse(cleaned);
      } catch (secondError) {
        console.error('[Gemini] JSON repair failed. Original text:', text.substring(0, 500));
        throw new Error(`Failed to parse Gemini response as JSON: ${secondError.message}`);
      }
    }
  });
};

// Legacy export for any code that imports getModel
export const getModel = () => ({ generateContent: generateText });
