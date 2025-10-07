#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeFirebase } from './firebase/admin.js';
import { toolRegistry } from './tools/registry.js';

class CODLoadoutServer {
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

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
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
        // Extract context from request headers or create session
        const context = {
          userId: (request as any).meta?.userId || 'anonymous',
          sessionId: (request as any).meta?.sessionId || 'default',
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

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    // Initialize Firebase
    initializeFirebase();

    // Create transport and connect
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('COD Loadout Pro MCP server running on stdio');
  }
}

const server = new CODLoadoutServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});