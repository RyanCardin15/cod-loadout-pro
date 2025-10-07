import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeFirebase } from '../server/src/firebase/admin.js';
import { toolRegistry } from '../server/src/tools/registry.js';
import { listWidgetResources, getWidgetTemplate } from '../server/src/resources/templates.js';

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
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
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

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: listWidgetResources(),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const template = getWidgetTemplate(uri);

      if (!template) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Resource not found: ${uri}`
        );
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/html+skybridge',
            text: template,
          },
        ],
      };
    });
  }

  async handleRequest(request: any): Promise<any> {
    // Handle MCP protocol requests
    if (request.method === 'initialize') {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: "cod-loadout-pro",
            version: "1.0.0"
          }
        }
      };
    } else if (request.method === 'tools/list') {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: Object.values(toolRegistry).map(tool => ({
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: tool.annotations || {
              readOnlyHint: true,
              openWorldHint: true
            }
          })),
        }
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;

      const tool = toolRegistry[name];
      if (!tool) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: ErrorCode.MethodNotFound,
            message: `Unknown tool: ${name}`
          }
        };
      }

      try {
        const context = {
          userId: request.meta?.userId || 'anonymous',
          sessionId: request.meta?.sessionId || 'default',
        };

        const result = await tool.execute(args, context);

        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: result.content || [{ type: 'text', text: 'Operation completed successfully' }],
            isError: false,
            _meta: result._meta,
          }
        };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: ErrorCode.InternalError,
            message: `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`
          }
        };
      }
    } else if (request.method === 'resources/list') {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          resources: listWidgetResources()
        }
      };
    } else if (request.method === 'resources/read') {
      const { uri } = request.params;
      const template = getWidgetTemplate(uri);

      if (!template) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: ErrorCode.InvalidRequest,
            message: `Resource not found: ${uri}`
          }
        };
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/html+skybridge',
              text: template,
            },
          ],
        }
      };
    } else {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: `Unknown method: ${request.method}`
        }
      };
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