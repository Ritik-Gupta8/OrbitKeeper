/**
 * Secret Manager Utility
 *
 * Provides production secret resolution with zero local friction:
 * 1. Checks process.env first (for local .env and Cloud Run Secret-bound environment variables).
 * 2. In GCP production, can lazily resolve from Google Cloud Secret Manager if needed.
 * 3. Caches resolved secrets in memory to prevent recurring network hops.
 *
 * Security:
 * - Never logs secret values.
 * - Never returns secret values in API responses.
 * - Fails safely without exposing stack traces containing credentials.
 */

import dotenv from 'dotenv';
dotenv.config();

const secretCache = new Map();

/**
 * Get a configuration or secret value securely.
 * @param {string} secretName - Environment variable or Secret Manager secret name
 * @param {string} defaultValue - Optional default value
 * @returns {Promise<string|null>}
 */
export const getSecret = async (secretName, defaultValue = null) => {
  // 1. Check in-memory cache first
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  // 2. Check process.env (Local .env or Cloud Run mounted secret)
  const envVal = process.env[secretName];
  if (envVal) {
    secretCache.set(secretName, envVal);
    return envVal;
  }

  // 3. Optional fallback to Google Cloud Secret Manager in production GCP environment
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId && process.env.NODE_ENV === 'production') {
    try {
      const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
      const client = new SecretManagerServiceClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload) {
        secretCache.set(secretName, payload);
        return payload;
      }
    } catch (err) {
      // Gracefully fall through to default without logging secret contents
      console.warn(`[SecretManager] Optional secret lookup for '${secretName}' bypassed:`, err.message);
    }
  }

  return defaultValue;
};
