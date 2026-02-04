import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const DOCKERFILE_PATH = join(__dirname, '../../docker/migrate/Dockerfile');
const BUILD_CONTEXT = join(__dirname, '../..');
const IMAGE_NAME = 'openclaw-migrate-test';

/**
 * Tests for hardened migrate Dockerfile
 *
 * Requirements:
 * - Non-root user
 * - OCI labels via build args
 * - Pinned base image version
 * - Multi-arch build support (linux/amd64, linux/arm64)
 */
describe('Migrate Dockerfile hardening', () => {
  describe('Dockerfile content validation', () => {
    let dockerfileContent: string;

    beforeAll(() => {
      dockerfileContent = readFileSync(DOCKERFILE_PATH, 'utf-8');
    });

    it('pins base image to specific version', () => {
      // Should use migrate/migrate:v4.x.x, not :latest
      const fromLine = dockerfileContent.match(/^FROM\s+(\S+)/m)?.[1];
      expect(fromLine).toBeDefined();
      expect(fromLine).toMatch(/^migrate\/migrate:v\d+\.\d+\.\d+$/);
    });

    it('defines OCI label build args', () => {
      const requiredArgs = [
        'BUILD_DATE',
        'VCS_REF',
        'VERSION',
      ];

      for (const arg of requiredArgs) {
        expect(dockerfileContent).toContain(`ARG ${arg}`);
      }
    });

    it('includes required OCI labels', () => {
      const requiredLabels = [
        'org.opencontainers.image.title',
        'org.opencontainers.image.description',
        'org.opencontainers.image.version',
        'org.opencontainers.image.created',
        'org.opencontainers.image.source',
        'org.opencontainers.image.revision',
        'org.opencontainers.image.licenses',
      ];

      for (const label of requiredLabels) {
        expect(dockerfileContent).toContain(label);
      }
    });

    it('sets USER directive for non-root execution', () => {
      // Should have a USER directive
      expect(dockerfileContent).toMatch(/^USER\s+\S+/m);
    });
  });

  describe('Image build validation', () => {
    beforeAll(() => {
      // Build the image with test labels
      const buildCommand = [
        'docker', 'build',
        '-f', DOCKERFILE_PATH,
        '-t', IMAGE_NAME,
        '--build-arg', 'BUILD_DATE=2026-02-04T00:00:00Z',
        '--build-arg', 'VCS_REF=abc123',
        '--build-arg', 'VERSION=1.0.0-test',
        BUILD_CONTEXT,
      ].join(' ');

      execSync(buildCommand, { stdio: 'pipe' });
    }, 120000);

    afterAll(() => {
      // Clean up test image
      try {
        execSync(`docker rmi ${IMAGE_NAME}`, { stdio: 'pipe' });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('image has OCI labels set correctly', () => {
      const inspectResult = execSync(
        `docker inspect ${IMAGE_NAME} --format '{{json .Config.Labels}}'`,
        { encoding: 'utf-8' }
      );

      const labels = JSON.parse(inspectResult);

      expect(labels['org.opencontainers.image.title']).toBe('openclaw-projects-migrate');
      expect(labels['org.opencontainers.image.version']).toBe('1.0.0-test');
      expect(labels['org.opencontainers.image.created']).toBe('2026-02-04T00:00:00Z');
      expect(labels['org.opencontainers.image.revision']).toBe('abc123');
      expect(labels['org.opencontainers.image.source']).toContain('github.com');
      expect(labels['org.opencontainers.image.licenses']).toBeDefined();
    });

    it('image runs as non-root user', () => {
      // Run a test container and check the user
      const result = spawnSync('docker', [
        'run', '--rm', '--entrypoint', 'id',
        IMAGE_NAME,
      ], { encoding: 'utf-8' });

      const output = result.stdout || result.stderr;

      // The migrate image is Alpine-based, check we're not running as root (uid=0)
      // We expect the user to be non-root
      expect(output).not.toMatch(/uid=0\(root\)/);
    });

    it('migrations directory is present', () => {
      const result = spawnSync('docker', [
        'run', '--rm', '--entrypoint', 'ls',
        IMAGE_NAME, '-la', '/migrations',
      ], { encoding: 'utf-8' });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('001_init.up.sql');
    });

    it('migrate binary is executable', () => {
      const result = spawnSync('docker', [
        'run', '--rm',
        IMAGE_NAME, '--version',
      ], { encoding: 'utf-8' });

      // migrate tool should output version info
      expect(result.stdout + result.stderr).toMatch(/\d+\.\d+/);
    });
  });

  describe('Multi-architecture build validation', () => {
    it('builds for linux/amd64', () => {
      const result = spawnSync('docker', [
        'buildx', 'build',
        '--platform', 'linux/amd64',
        '-f', DOCKERFILE_PATH,
        '--build-arg', 'BUILD_DATE=2026-02-04T00:00:00Z',
        '--build-arg', 'VCS_REF=test',
        '--build-arg', 'VERSION=test',
        BUILD_CONTEXT,
      ], { encoding: 'utf-8', timeout: 120000 });

      expect(result.status).toBe(0);
    }, 180000);

    it('builds for linux/arm64', () => {
      const result = spawnSync('docker', [
        'buildx', 'build',
        '--platform', 'linux/arm64',
        '-f', DOCKERFILE_PATH,
        '--build-arg', 'BUILD_DATE=2026-02-04T00:00:00Z',
        '--build-arg', 'VCS_REF=test',
        '--build-arg', 'VERSION=test',
        BUILD_CONTEXT,
      ], { encoding: 'utf-8', timeout: 120000 });

      expect(result.status).toBe(0);
    }, 180000);
  });
});
