import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeFirebase } from '../server/src/firebase/admin.js';
import { toolRegistry } from '../server/src/tools/registry.js';

// Initialize Firebase on module load
initializeFirebase();

class VercelMCPHandler {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'cod-loadout-pro',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(toolRegistry).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = toolRegistry[name];
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      try {
        const context = {
          userId: request.meta?.userId || 'anonymous',
          sessionId: request.meta?.sessionId || 'default',
        };

        const result = await tool.execute(args, context);

        return {
          content: result.content || [{ type: 'text', text: 'Operation completed successfully' }],
          isError: false,
          _meta: result._meta,
        };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async handleRequest(request: any): Promise<any> {
    // Handle MCP protocol requests
    if (request.method === 'tools/list') {
      return this.server.request(request, ListToolsRequestSchema);
    } else if (request.method === 'tools/call') {
      return this.server.request(request, CallToolRequestSchema);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown method: ${request.method}`);
    }
  }
}

const mcpHandler = new VercelMCPHandler();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Health check / server info
    return res.status(200).json({
      name: 'cod-loadout-pro',
      version: '1.0.0',
      description: 'COD Loadout Assistant MCP Server',
      capabilities: {
        tools: {},
        resources: {},
      }
    });
  }

  if (req.method === 'POST') {
    try {
      const result = await mcpHandler.handleRequest(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error('MCP Handler Error:', error);

      if (error instanceof McpError) {
        return res.status(400).json({
          error: {
            code: error.code,
            message: error.message,
          }
        });
      }

      return res.status(500).json({
        error: {
          code: ErrorCode.InternalError,
          message: 'Internal server error',
        }
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}