import { searchWeaponsTool } from './search-weapons.js';
import { getLoadoutTool } from './get-loadout.js';
import { counterLoadoutTool } from './counter-loadout.js';
import { analyzePlaystyleTool } from './analyze-playstyle.js';
import { getMetaTool } from './get-meta.js';
import { saveLoadoutTool } from './save-loadout.js';
import { myLoadoutsTool } from './my-loadouts.js';

export interface MCPTool {
  name: string;
  title: string;
  description: string;
  inputSchema: any;
  annotations?: {
    readOnlyHint?: boolean;
    openWorldHint?: boolean;
  };
  _meta?: any;
  execute(input: unknown, context: { userId: string; sessionId: string }): Promise<any>;
}

export const toolRegistry: Record<string, MCPTool> = {
  search_weapons: searchWeaponsTool,
  get_loadout: getLoadoutTool,
  counter_loadout: counterLoadoutTool,
  analyze_playstyle: analyzePlaystyleTool,
  get_meta: getMetaTool,
  save_loadout: saveLoadoutTool,
  my_loadouts: myLoadoutsTool,
};