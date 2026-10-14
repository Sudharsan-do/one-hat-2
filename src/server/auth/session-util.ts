export async function generateSessionId(): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { randomUUID, randomBytes } = await import('node:crypto');
      try {
        return randomUUID();
      } catch {
        const bytes = randomBytes(16);
        bytes[6] = (bytes[6]! & 0x0f) | 0x40;
        bytes[8] = (bytes[8]! & 0x3f) | 0x80;
        const hex = bytes.toString('hex');
        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32)
        ].join('-');
      }
    } catch (error) {
      throw new Error(`Failed to generate session ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  throw new Error('No cryptographically secure random source available');
}

export function generateSessionIdSync(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    throw new Error('Use generateSessionId() async version in Node.js environment');
  }
  throw new Error('No cryptographically secure random source available');
}