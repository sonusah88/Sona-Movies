/**
 * ProviderRegistry.js
 * Central registry that holds initialized provider instances.
 */

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} is already registered.`);
      return;
    }
    this.providers.set(provider.id, provider);
    console.log(`[Registry] Registered provider: ${provider.name}`);
  }

  getProvider(id) {
    return this.providers.get(id);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getActiveProviders() {
    return this.getAllProviders().filter(p => p.status !== '🔴 Offline' && p.status !== '⚪ Disabled');
  }

  // Admin capability: mock health check
  async checkHealth() {
    // In a real backend, this would ping provider APIs.
    // For now, we simulate all registered as Operational.
    for (const provider of this.providers.values()) {
      if (provider.status !== '⚪ Disabled') {
        provider.status = '🟢 Operational';
      }
    }
  }
}

export const registry = new ProviderRegistry();
