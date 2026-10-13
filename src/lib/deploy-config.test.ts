// The Caddyfile on the VPS must send the same headers the local test server sends.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const headers = JSON.parse(readFileSync('deploy/headers.json', 'utf8')) as Record<string, string>;
const caddy = readFileSync('deploy/Caddyfile', 'utf8');

describe('deploy/Caddyfile', () => {
  for (const [name, value] of Object.entries(headers)) {
    if (name.startsWith('_')) continue;
    it(`sends ${name} exactly as deploy/headers.json`, () => {
      expect(caddy).toContain(`${name} "${value}"`);
    });
  }
  it('keeps the launch password in a separate, untracked file', () => {
    expect(caddy).toContain('import /etc/caddy/auth.caddy');
    expect(caddy).not.toMatch(/basic_?auth\s*\{/);
  });
});
