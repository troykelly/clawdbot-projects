import { describe, it, expect } from 'vitest';

describe('Layout Components', () => {
  describe('Sidebar', () => {
    it('should export Sidebar component', async () => {
      const { Sidebar } = await import('../src/ui/components/layout');
      expect(Sidebar).toBeDefined();
      expect(typeof Sidebar).toBe('function');
    });

    it('should export NavItem type', async () => {
      // Type is exported, we just verify the module loads
      const layout = await import('../src/ui/components/layout');
      expect(layout).toBeDefined();
    });
  });

  describe('MobileNav', () => {
    it('should export MobileNav component', async () => {
      const { MobileNav } = await import('../src/ui/components/layout');
      expect(MobileNav).toBeDefined();
      expect(typeof MobileNav).toBe('function');
    });
  });

  describe('Breadcrumb', () => {
    it('should export Breadcrumb component', async () => {
      const { Breadcrumb } = await import('../src/ui/components/layout');
      expect(Breadcrumb).toBeDefined();
      expect(typeof Breadcrumb).toBe('function');
    });
  });

  describe('AppShell', () => {
    it('should export AppShell component', async () => {
      const { AppShell } = await import('../src/ui/components/layout');
      expect(AppShell).toBeDefined();
      expect(typeof AppShell).toBe('function');
    });
  });
});
