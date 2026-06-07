/**
 * MCP Routes
 *
 * POST /mcp            — MCP protocol endpoint (Streamable HTTP transport)
 * GET  /api/mcp/tools  — Live tool manifest for demo / judges
 *
 * Each POST request creates a fresh McpServer + Transport pair.
 * The MCP SDK requires one server instance per transport connection.
 */

import express from 'express';
import { createMcpServer, createTransport, getToolManifest, TOOL_COUNT } from '../mcp/mcpServer.js';

const router = express.Router();

// ── POST /mcp — MCP Protocol Endpoint ────────────────────────────────────────

router.post('/', async (req, res) => {
  // Fresh server + transport per request (SDK requirement)
  const server    = createMcpServer();
  const transport = createTransport();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[MCP] Request error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'MCP transport error', message: err.message });
    }
  } finally {
    res.on('finish', () => server.close().catch(() => {}));
  }
});

// ── GET /mcp — SSE (some clients use GET for event streams) ──────────────────

router.get('/', async (req, res) => {
  const server    = createMcpServer();
  const transport = createTransport();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[MCP] SSE error:', err.message);
    if (!res.headersSent) {
      res.status(405).json({ error: 'Use POST /mcp for MCP protocol requests' });
    }
  }
});

// ── GET /api/mcp/tools — Tool Manifest ───────────────────────────────────────

router.get('/tools', (req, res) => {
  res.json({
    server:      'internship-copilot-mongodb',
    version:     '1.0.0',
    partner:     'MongoDB',
    transport:   'Streamable HTTP — POST /mcp',
    toolCount:   TOOL_COUNT,
    tools:       getToolManifest(),
    description: 'All AI agents call these tools via the MCP protocol. No agent accesses MongoDB directly.',
  });
});

export default router;
