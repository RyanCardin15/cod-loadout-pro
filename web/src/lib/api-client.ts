/**
 * API Client for communicating with the MCP server
 * Wraps MCP protocol calls in a user-friendly interface
 */

const MCP_ENDPOINT = process.env['NEXT_PUBLIC_MCP_ENDPOINT'] || '/api/mcp';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

class MCPError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

let requestId = 0;

async function mcpCall<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: ++requestId,
    method,
    ...(params && { params }),
  };

  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MCPResponse<T> = await response.json();

    if (data.error) {
      throw new MCPError(data.error.code, data.error.message, data.error.data);
    }

    if (!data.result) {
      throw new Error('No result in response');
    }

    return data.result;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }
    throw new Error(`MCP call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function callTool<T = unknown>(toolName: string, args: Record<string, unknown> | unknown): Promise<T> {
  const result = await mcpCall<any>('tools/call', {
    name: toolName,
    arguments: args as Record<string, unknown>,
  });

  return result;
}

// API methods

export interface SearchWeaponsParams {
  query?: string;
  game?: 'MW3' | 'Warzone' | 'BO6' | 'MW2';
  category?: 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol';
  situation?: string;
  playstyle?: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';
  tier?: 'S' | 'A' | 'B' | 'C' | 'D';
  limit?: number;
}

export interface GetLoadoutParams {
  weaponId?: string;
  weaponName?: string;
  game?: 'MW3' | 'Warzone' | 'BO6' | 'MW2';
  situation?: string;
  playstyle?: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';
}

export interface CounterLoadoutParams {
  enemyWeapon: string;
  enemyLoadout?: Record<string, unknown>;
  game?: 'MW3' | 'Warzone' | 'BO6' | 'MW2';
  myPlaystyle?: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';
}

export interface AnalyzePlaystyleParams {
  description: string;
  preferences?: Record<string, unknown>;
}

export interface GetMetaParams {
  game?: 'MW3' | 'Warzone' | 'BO6' | 'MW2';
  category?: 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol';
  mode?: string;
}

export interface SaveLoadoutParams {
  loadoutId?: string;
  loadout?: Record<string, unknown>;
}

export const api = {
  /**
   * Search for weapons based on criteria
   */
  searchWeapons: (params: SearchWeaponsParams) =>
    callTool('search_weapons', params),

  /**
   * Get a complete loadout for a weapon
   */
  getLoadout: (params: GetLoadoutParams) =>
    callTool('get_loadout', params),

  /**
   * Get counter strategies for an enemy loadout
   */
  counterLoadout: (params: CounterLoadoutParams) =>
    callTool('counter_loadout', params),

  /**
   * Analyze playstyle and get recommendations
   */
  analyzePlaystyle: (params: AnalyzePlaystyleParams) =>
    callTool('analyze_playstyle', params),

  /**
   * Get current meta tier lists
   */
  getMeta: (params: GetMetaParams = {}) =>
    callTool('get_meta', params),

  /**
   * Save a loadout to favorites
   */
  saveLoadout: (params: SaveLoadoutParams) =>
    callTool('save_loadout', params),

  /**
   * Get user's saved loadouts
   */
  myLoadouts: () =>
    callTool('my_loadouts', {}),
};

export { MCPError };
