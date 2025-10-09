import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

/**
 * In-memory OAuth clients store
 *
 * For production, you should store this in a database.
 * For the apps SDK, ChatGPT will be the primary client.
 */
export class MemoryClientsStore implements OAuthRegisteredClientsStore {
  private clients = new Map<string, OAuthClientInformationFull>();

  constructor() {
    // Register default ChatGPT client
    this.registerDefaultClients();
  }

  /**
   * Get client by ID
   */
  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    return this.clients.get(clientId);
  }

  /**
   * Register a new client (optional - for dynamic client registration)
   */
  async registerClient(
    client: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>
  ): Promise<OAuthClientInformationFull> {
    // Generate client ID and timestamp
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fullClient: OAuthClientInformationFull = {
      ...client,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };

    this.clients.set(clientId, fullClient);
    return fullClient;
  }

  /**
   * Update existing client
   */
  async updateClient(clientId: string, updates: Partial<OAuthClientInformationFull>): Promise<void> {
    const existing = this.clients.get(clientId);
    if (!existing) {
      throw new Error('Client not found');
    }

    this.clients.set(clientId, {
      ...existing,
      ...updates,
    });
  }

  /**
   * Delete client
   */
  async deleteClient(clientId: string): Promise<void> {
    this.clients.delete(clientId);
  }

  /**
   * List all clients (for admin purposes)
   */
  async listClients(): Promise<OAuthClientInformationFull[]> {
    return Array.from(this.clients.values());
  }

  /**
   * Register default clients for the apps SDK
   */
  private registerDefaultClients(): void {
    // ChatGPT Apps SDK client
    const chatgptClient: OAuthClientInformationFull = {
      client_id: process.env.OAUTH_CHATGPT_CLIENT_ID || 'chatgpt-apps-sdk',
      client_name: 'ChatGPT Apps SDK',
      redirect_uris: [
        'https://chatgpt.com/oauth/callback',
        'https://chat.openai.com/oauth/callback',
        // Add your development callback URLs
        'http://localhost:3000/oauth/callback',
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'read write profile',
      token_endpoint_auth_method: 'none', // PKCE-only, no client secret
    };

    this.clients.set(chatgptClient.client_id, chatgptClient);

    // Development/testing client
    const devClient: OAuthClientInformationFull = {
      client_id: process.env.OAUTH_DEV_CLIENT_ID || 'counterplay-dev',
      client_name: 'Counterplay Development',
      redirect_uris: [
        'http://localhost:3000/oauth/callback',
        'http://localhost:3001/oauth/callback',
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'read write profile admin',
      token_endpoint_auth_method: 'none',
    };

    this.clients.set(devClient.client_id, devClient);
  }
}

/**
 * Singleton instance
 */
export const clientsStore = new MemoryClientsStore();
