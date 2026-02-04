/**
 * Smoke tests for OpenClaw gateway devcontainer integration.
 *
 * These tests verify the devcontainer configuration correctly sets up
 * the OpenClaw gateway from source. They validate file presence and
 * configuration structure rather than running the gateway (which requires
 * the full devcontainer runtime).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const DEVCONTAINER_DIR = resolve(import.meta.dirname, '../../.devcontainer');

describe('OpenClaw Gateway Devcontainer Configuration', () => {
  describe('docker-compose.devcontainer.yml', () => {
    const composePath = resolve(DEVCONTAINER_DIR, 'docker-compose.devcontainer.yml');

    it('should exist', () => {
      expect(existsSync(composePath)).toBe(true);
    });

    it('should define openclaw_gateway_source volume', () => {
      const content = readFileSync(composePath, 'utf-8');
      const config = parse(content);
      expect(config.volumes).toHaveProperty('openclaw_gateway_source');
    });

    it('should mount gateway source volume in workspace service', () => {
      const content = readFileSync(composePath, 'utf-8');
      const config = parse(content);
      const workspaceVolumes: string[] = config.services.workspace.volumes;
      const gatewayMount = workspaceVolumes.find((v: string) =>
        v.includes('openclaw_gateway_source') && v.includes('/workspaces/openclaw-gateway'),
      );
      expect(gatewayMount).toBeDefined();
    });
  });

  describe('postCreate.sh', () => {
    const postCreatePath = resolve(DEVCONTAINER_DIR, 'postCreate.sh');

    it('should exist', () => {
      expect(existsSync(postCreatePath)).toBe(true);
    });

    it('should contain install_openclaw_gateway function', () => {
      const content = readFileSync(postCreatePath, 'utf-8');
      expect(content).toContain('install_openclaw_gateway');
    });

    it('should clone from github.com/openclaw/openclaw', () => {
      const content = readFileSync(postCreatePath, 'utf-8');
      expect(content).toContain('github.com/openclaw/openclaw');
    });

    it('should install dependencies with pnpm', () => {
      const content = readFileSync(postCreatePath, 'utf-8');
      expect(content).toContain('pnpm install');
    });

    it('should use /workspaces/openclaw-gateway as gateway directory', () => {
      const content = readFileSync(postCreatePath, 'utf-8');
      expect(content).toContain('/workspaces/openclaw-gateway');
    });

    it('should call install_openclaw_gateway function', () => {
      const content = readFileSync(postCreatePath, 'utf-8');
      // Check that it is called (not just defined)
      const lines = content.split('\n');
      const callLine = lines.find(
        (line) =>
          line.trim() === 'install_openclaw_gateway' &&
          !line.trim().startsWith('#') &&
          !line.includes('()'),
      );
      expect(callLine).toBeDefined();
    });
  });

  describe('scripts/openclaw-gateway.sh', () => {
    const scriptPath = resolve(import.meta.dirname, '../../scripts/openclaw-gateway.sh');

    it('should exist', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should skip channels for dev mode', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('OPENCLAW_SKIP_CHANNELS=1');
    });

    it('should support configurable port via OPENCLAW_GATEWAY_PORT', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('OPENCLAW_GATEWAY_PORT');
    });

    it('should use default port 18789', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('18789');
    });

    it('should support --reset flag', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('--reset');
    });
  });

  describe('devcontainer.json', () => {
    const devcontainerPath = resolve(DEVCONTAINER_DIR, 'devcontainer.json');

    it('should exist', () => {
      expect(existsSync(devcontainerPath)).toBe(true);
    });

    it('should reference docker-compose file', () => {
      const content = readFileSync(devcontainerPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.dockerComposeFile).toBe('docker-compose.devcontainer.yml');
    });

    it('should use postCreate.sh as postCreateCommand', () => {
      const content = readFileSync(devcontainerPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.postCreateCommand).toContain('postCreate.sh');
    });
  });
});
