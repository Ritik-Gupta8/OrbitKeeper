/**
 * OrbitKeeper — MCP Client
 *
 * This singleton client is used by every AI agent to call MongoDB tools
 * through the MCP protocol. Agents NEVER import mongoMCP.js or toolHandlers.js
 * directly — they always go through this client.
 *
 * Transport: StreamableHTTP → POST http://localhost:PORT/mcp
 *
 * Usage in an agent:
 *   import mcpClient from '../mcp/mcpClient.js';
 *   const result = await mcpClient.callTool('store_ai_analysis', { applicationId, analysis });
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import dotenv from 'dotenv';
dotenv.config();

const getMcpServerUrl = () => `http://127.0.0.1:${process.env.PORT || 5000}/mcp`;

class MCPClient {
  constructor() {
    this._client    = null;
    this._connected = false;
    this._connecting = false;
  }

  async connect() {
    if (this._connected) return;
    if (this._connecting) {
      // Wait for in-flight connection
      await new Promise(r => setTimeout(r, 200));
      return;
    }
    this._connecting = true;
    const url = getMcpServerUrl();
    try {
      this._client = new Client(
        { name: 'orbitkeeper-agent', version: '1.0.0' },
        { capabilities: { tools: {} } }
      );
      const transport = new StreamableHTTPClientTransport(new URL(url));
      await this._client.connect(transport);
      this._connected  = true;
      this._connecting = false;
      console.log(`[MCPClient] ✅ Connected to MCP server at ${url}`);
    } catch (err) {
      this._connecting = false;

      // Not fatal — will retry on next call
      console.warn(`[MCPClient] ⚠️  Could not connect to MCP server: ${err.message}`);
    }
  }

  /**
   * Call an MCP tool by name with arguments.
   * Returns the parsed JSON result from the tool's text content.
   *
   * @param {string} toolName  - One of the registered tool names
   * @param {object} args      - Tool input matching its schema
   * @returns {object}         - Parsed result object
   */
  async callTool(toolName, args = {}) {
    // Attempt MCP protocol transport first
    if (!this._connected) await this.connect();

    if (this._connected && this._client) {
      try {
        console.log(`[MCPClient] 🔧 Calling tool: ${toolName}`, JSON.stringify(args).substring(0, 120));
        const response = await this._client.callTool({ name: toolName, arguments: args });

        // MCP returns content array — first text item contains our JSON
        const textContent = response.content?.find(c => c.type === 'text');
        if (textContent) {
          const result = JSON.parse(textContent.text);
          console.log(`[MCPClient] ✅ Tool ${toolName} returned successfully`);
          return result;
        }
      } catch (callErr) {
        console.warn(`[MCPClient] Tool ${toolName} via protocol failed (${callErr.message}), using direct handler fallback`);
      }
    }

    // Direct Handler Fallback: Guarantees zero failures even if internal HTTP transport is unavailable
    console.log(`[MCPClient] ⚡ Fallback: Executing ${toolName} via direct tool handler`);
    const handlers = await import('./toolHandlers.js');
    const handlerFn = handlers[`handle_${toolName}`];
    if (typeof handlerFn === 'function') {
      return await handlerFn(args);
    }

    throw new Error(`Tool handler handle_${toolName} not found`);
  }

  /**
   * List all available tools from the MCP server.
   * Useful for debugging and the demo endpoint.
   */
  async listTools() {
    if (!this._connected) await this.connect();
    if (!this._connected || !this._client) return [];
    const response = await this._client.listTools();
    return response.tools || [];
  }

  disconnect() {
    if (this._client) {
      this._client.close().catch(() => {});
      this._client    = null;
      this._connected = false;
    }
  }
}

// Export a singleton — all agents share one connection
const mcpClient = new MCPClient();
export default mcpClient;
