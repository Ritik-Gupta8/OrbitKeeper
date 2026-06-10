/**
 * OrbitKeeper — MongoDB MCP Server
 *
 * A real Model Context Protocol server built with @modelcontextprotocol/sdk.
 * Exposes 14 tools that AI agents use to read/write MongoDB.
 *
 * Transport: Streamable HTTP  →  POST /mcp
 * Tool list:                  →  GET  /api/mcp/tools
 *
 * IMPORTANT: Each HTTP request gets its own McpServer + Transport instance.
 * The MCP SDK does not allow a single server to handle multiple transports.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  handle_find_documents,
  handle_insert_document,
  handle_update_document,
  handle_delete_document,
  handle_aggregate,
  handle_list_collections,
  handle_store_ai_analysis,
  handle_get_upcoming_deadlines,
  handle_get_dashboard_stats,
  handle_mark_reminder_sent,
  handle_log_notification,
  handle_get_profile,
  handle_update_profile,
  handle_search_applications,
} from './toolHandlers.js';

// ── Tool definitions ──────────────────────────────────────────────────────────
// Stored as config so we can register them on any McpServer instance
// and also expose them via the tool manifest endpoint.

const TOOL_DEFINITIONS = [
  {
    name: 'find_documents',
    description: 'Query documents from a MongoDB collection with optional filters and sorting.',
    schema: {
      collection: z.enum(['applications', 'notification_logs', 'profiles']).describe('Target collection name'),
      filter:     z.record(z.any()).optional().default({}).describe('MongoDB query filter object'),
      limit:      z.number().int().min(1).max(200).optional().default(50).describe('Max documents to return'),
      sort:       z.record(z.number()).optional().default({}).describe('Sort spec e.g. { createdAt: -1 }'),
    },
    handler: ({ collection, filter, limit, sort }) =>
      handle_find_documents({ collection, filter, limit, sort }),
  },
  {
    name: 'insert_document',
    description: 'Insert a new document into a MongoDB collection.',
    schema: {
      collection: z.enum(['applications', 'notification_logs', 'profiles']).describe('Target collection name'),
      document:   z.record(z.any()).describe('The document object to insert'),
    },
    handler: ({ collection, document }) =>
      handle_insert_document({ collection, document }),
  },
  {
    name: 'update_document',
    description: 'Update an existing document in MongoDB by its ID.',
    schema: {
      collection: z.enum(['applications', 'notification_logs', 'profiles']).describe('Target collection name'),
      id:         z.string().describe('MongoDB ObjectId of the document to update'),
      updates:    z.record(z.any()).describe('Fields to update'),
    },
    handler: ({ collection, id, updates }) =>
      handle_update_document({ collection, id, updates }),
  },
  {
    name: 'delete_document',
    description: 'Delete a document from MongoDB by its ID.',
    schema: {
      collection: z.enum(['applications', 'notification_logs', 'profiles']).describe('Target collection name'),
      id:         z.string().describe('MongoDB ObjectId of the document to delete'),
    },
    handler: ({ collection, id }) =>
      handle_delete_document({ collection, id }),
  },
  {
    name: 'aggregate',
    description: 'Run a MongoDB aggregation pipeline on a collection.',
    schema: {
      collection: z.enum(['applications', 'notification_logs', 'profiles']).describe('Target collection name'),
      pipeline:   z.array(z.record(z.any())).describe('MongoDB aggregation pipeline stages'),
    },
    handler: ({ collection, pipeline }) =>
      handle_aggregate({ collection, pipeline }),
  },
  {
    name: 'list_collections',
    description: 'List all collections in the MongoDB database.',
    schema: {},
    handler: () => handle_list_collections(),
  },
  {
    name: 'store_ai_analysis',
    description: 'Store the complete AI analysis result for an internship application (match score, skill gaps, action plan, interview questions).',
    schema: {
      applicationId: z.string().describe('MongoDB ObjectId of the application'),
      analysis: z.object({
        jobSummary:             z.record(z.any()).optional(),
        matchScore:             z.number().min(0).max(100).optional(),
        strengthAreas:          z.array(z.string()).optional(),
        weaknessAreas:          z.array(z.string()).optional(),
        missingSkills:          z.array(z.string()).optional(),
        improvementSuggestions: z.array(z.string()).optional(),
        actionPlan:             z.array(z.record(z.any())).optional(),
        interviewQuestions:     z.record(z.any()).optional(),
      }).describe('The full AI analysis payload'),
    },
    handler: ({ applicationId, analysis }) =>
      handle_store_ai_analysis({ applicationId, analysis }),
  },
  {
    name: 'get_upcoming_deadlines',
    description: 'Retrieve applications with deadlines approaching within N hours. Used by the Deadline Monitoring Agent. Optionally filter by userId for multi-user support.',
    schema: {
      hoursAhead: z.number().int().min(1).max(168).optional().default(25).describe('Hours ahead to look'),
      userId:     z.string().optional().describe('Filter by user ID (optional)'),
    },
    handler: ({ hoursAhead, userId }) =>
      handle_get_upcoming_deadlines({ hoursAhead, userId }),
  },
  {
    name: 'get_dashboard_stats',
    description: 'Aggregate dashboard statistics: total apps, by-status counts, average match score, recent activity, upcoming deadlines.',
    schema: {
      userId: z.string().optional().default('default').describe('User identifier'),
    },
    handler: ({ userId }) =>
      handle_get_dashboard_stats({ userId }),
  },
  {
    name: 'mark_reminder_sent',
    description: 'Mark a 24h or 12h deadline reminder as sent, preventing duplicate notifications.',
    schema: {
      applicationId: z.string().describe('MongoDB ObjectId of the application'),
      type:          z.enum(['24h', '12h']).describe('Which reminder was sent'),
    },
    handler: ({ applicationId, type }) =>
      handle_mark_reminder_sent({ applicationId, type }),
  },
  {
    name: 'log_notification',
    description: 'Log a sent notification event to notification_logs for audit and deduplication.',
    schema: {
      data: z.object({
        applicationId:    z.string(),
        company:          z.string().optional(),
        role:             z.string().optional(),
        notificationType: z.enum(['24_hour_reminder', '12_hour_reminder', 'custom']),
        channel:          z.enum(['email', 'push', 'sms', 'whatsapp']).optional(),
        sentTo:           z.string().optional(),
        status:           z.enum(['sent', 'failed']).optional(),
        errorMessage:     z.string().optional(),
      }).describe('Notification log entry'),
    },
    handler: ({ data }) =>
      handle_log_notification({ data }),
  },
  {
    name: 'get_profile',
    description: "Retrieve the student's career profile including skills, resume text, education, and career goals.",
    schema: {
      userId: z.string().optional().default('default').describe('User identifier'),
    },
    handler: ({ userId }) =>
      handle_get_profile({ userId }),
  },
  {
    name: 'update_profile',
    description: "Update the student's career profile (skills, resume text, career goals, any profile field).",
    schema: {
      userId:  z.string().optional().default('default').describe('User identifier'),
      updates: z.record(z.any()).describe('Profile fields to update'),
    },
    handler: ({ userId, updates }) =>
      handle_update_profile({ userId, updates }),
  },
  {
    name: 'search_applications',
    description: 'Full-text search across applications by company, role, notes, or job description.',
    schema: {
      query:  z.string().describe('Search query string'),
      userId: z.string().optional().describe('Filter by user ID'),
    },
    handler: ({ query, userId }) =>
      handle_search_applications({ query, userId }),
  },
];

// ── Factory: create a fresh McpServer instance with all tools registered ──────
// Called once per HTTP request — the SDK requires a new instance per transport.

export function createMcpServer() {
  const server = new McpServer({
    name:    'orbitkeeper-mongodb',
    version: '1.0.0',
  });

  for (const def of TOOL_DEFINITIONS) {
    server.tool(
      def.name,
      def.description,
      def.schema,
      async (args) => {
        const result = await def.handler(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );
  }

  return server;
}

// ── Transport factory ─────────────────────────────────────────────────────────

export function createTransport() {
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session persistence
  });
}

// ── Tool manifest (for GET /api/mcp/tools) ────────────────────────────────────
// Built from TOOL_DEFINITIONS so it's always accurate without a live server.

export function getToolManifest() {
  return TOOL_DEFINITIONS.map(def => ({
    name:        def.name,
    description: def.description,
    inputSchema: Object.fromEntries(
      Object.entries(def.schema).map(([k, v]) => [k, { description: v.description || '' }])
    ),
  }));
}

export const TOOL_COUNT = TOOL_DEFINITIONS.length;
