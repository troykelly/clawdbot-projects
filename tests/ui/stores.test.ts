/**
 * Tests for Zustand stores.
 *
 * Validates state transitions, actions, and persistence behavior.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../../src/ui/stores/ui-store.ts';
import { useSelectionStore } from '../../src/ui/stores/selection-store.ts';
import { usePreferenceStore } from '../../src/ui/stores/preference-store.ts';

describe('UI Store', () => {
  beforeEach(() => {
    // Reset the store between tests
    useUiStore.setState({
      sidebarCollapsed: false,
      activeModal: null,
      commandPaletteOpen: false,
      theme: 'light',
    });
  });

  describe('sidebar', () => {
    it('should start with sidebar not collapsed', () => {
      const state = useUiStore.getState();
      expect(state.sidebarCollapsed).toBe(false);
    });

    it('should toggle sidebar state', () => {
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);

      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed explicitly', () => {
      useUiStore.getState().setSidebarCollapsed(true);
      expect(useUiStore.getState().sidebarCollapsed).toBe(true);

      useUiStore.getState().setSidebarCollapsed(false);
      expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('modals', () => {
    it('should start with no active modal', () => {
      expect(useUiStore.getState().activeModal).toBeNull();
    });

    it('should open a modal by id', () => {
      useUiStore.getState().openModal('quick-add');
      expect(useUiStore.getState().activeModal).toBe('quick-add');
    });

    it('should close the active modal', () => {
      useUiStore.getState().openModal('delete-confirm');
      useUiStore.getState().closeModal();
      expect(useUiStore.getState().activeModal).toBeNull();
    });

    it('should replace the current modal with a new one', () => {
      useUiStore.getState().openModal('quick-add');
      useUiStore.getState().openModal('create-work-item');
      expect(useUiStore.getState().activeModal).toBe('create-work-item');
    });
  });

  describe('command palette', () => {
    it('should start closed', () => {
      expect(useUiStore.getState().commandPaletteOpen).toBe(false);
    });

    it('should toggle open and closed', () => {
      useUiStore.getState().toggleCommandPalette();
      expect(useUiStore.getState().commandPaletteOpen).toBe(true);

      useUiStore.getState().toggleCommandPalette();
      expect(useUiStore.getState().commandPaletteOpen).toBe(false);
    });

    it('should set explicitly', () => {
      useUiStore.getState().setCommandPaletteOpen(true);
      expect(useUiStore.getState().commandPaletteOpen).toBe(true);
    });
  });

  describe('theme', () => {
    it('should start with light theme', () => {
      expect(useUiStore.getState().theme).toBe('light');
    });

    it('should set theme', () => {
      useUiStore.getState().setTheme('dark');
      expect(useUiStore.getState().theme).toBe('dark');
    });
  });
});

describe('Selection Store', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      selectedIds: new Set<string>(),
      filters: {},
    });
  });

  describe('selection', () => {
    it('should start with empty selection', () => {
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });

    it('should select a single item', () => {
      useSelectionStore.getState().select('item-1');
      expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);
      expect(useSelectionStore.getState().selectedIds.size).toBe(1);
    });

    it('should deselect a single item', () => {
      useSelectionStore.getState().select('item-1');
      useSelectionStore.getState().deselect('item-1');
      expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(false);
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });

    it('should toggle selection', () => {
      useSelectionStore.getState().toggleSelection('item-1');
      expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(true);

      useSelectionStore.getState().toggleSelection('item-1');
      expect(useSelectionStore.getState().selectedIds.has('item-1')).toBe(false);
    });

    it('should select many items', () => {
      useSelectionStore.getState().selectMany(['a', 'b', 'c']);
      const ids = useSelectionStore.getState().selectedIds;
      expect(ids.size).toBe(3);
      expect(ids.has('a')).toBe(true);
      expect(ids.has('b')).toBe(true);
      expect(ids.has('c')).toBe(true);
    });

    it('should select many without replacing existing selection', () => {
      useSelectionStore.getState().select('existing');
      useSelectionStore.getState().selectMany(['a', 'b']);
      expect(useSelectionStore.getState().selectedIds.size).toBe(3);
      expect(useSelectionStore.getState().selectedIds.has('existing')).toBe(true);
    });

    it('should select all (replaces current selection)', () => {
      useSelectionStore.getState().select('old');
      useSelectionStore.getState().selectAll(['new-1', 'new-2']);
      expect(useSelectionStore.getState().selectedIds.size).toBe(2);
      expect(useSelectionStore.getState().selectedIds.has('old')).toBe(false);
      expect(useSelectionStore.getState().selectedIds.has('new-1')).toBe(true);
    });

    it('should clear selection', () => {
      useSelectionStore.getState().selectMany(['a', 'b', 'c']);
      useSelectionStore.getState().clearSelection();
      expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    });

    it('should check if item is selected', () => {
      useSelectionStore.getState().select('item-1');
      expect(useSelectionStore.getState().isSelected('item-1')).toBe(true);
      expect(useSelectionStore.getState().isSelected('item-2')).toBe(false);
    });
  });

  describe('filters', () => {
    it('should start with empty filters', () => {
      expect(useSelectionStore.getState().filters).toEqual({});
    });

    it('should set a single filter', () => {
      useSelectionStore.getState().setFilter('status', ['open', 'in_progress']);
      expect(useSelectionStore.getState().filters.status).toEqual(['open', 'in_progress']);
    });

    it('should merge filters without losing existing ones', () => {
      useSelectionStore.getState().setFilter('status', ['open']);
      useSelectionStore.getState().setFilters({ priority: ['P0', 'P1'] });
      expect(useSelectionStore.getState().filters.status).toEqual(['open']);
      expect(useSelectionStore.getState().filters.priority).toEqual(['P0', 'P1']);
    });

    it('should set search filter', () => {
      useSelectionStore.getState().setFilter('search', 'test query');
      expect(useSelectionStore.getState().filters.search).toBe('test query');
    });

    it('should clear all filters', () => {
      useSelectionStore.getState().setFilter('status', ['open']);
      useSelectionStore.getState().setFilter('priority', ['P0']);
      useSelectionStore.getState().clearFilters();
      expect(useSelectionStore.getState().filters).toEqual({});
    });
  });
});

describe('Preference Store', () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();
    usePreferenceStore.setState({
      theme: 'system',
      defaultView: 'list',
      showCompleted: false,
      pageSize: 25,
      compactMode: false,
      notificationSound: true,
    });
  });

  describe('defaults', () => {
    it('should have correct default values', () => {
      const state = usePreferenceStore.getState();
      expect(state.theme).toBe('system');
      expect(state.defaultView).toBe('list');
      expect(state.showCompleted).toBe(false);
      expect(state.pageSize).toBe(25);
      expect(state.compactMode).toBe(false);
      expect(state.notificationSound).toBe(true);
    });
  });

  describe('theme', () => {
    it('should set theme preference', () => {
      usePreferenceStore.getState().setTheme('dark');
      expect(usePreferenceStore.getState().theme).toBe('dark');
    });
  });

  describe('defaultView', () => {
    it('should set default view mode', () => {
      usePreferenceStore.getState().setDefaultView('kanban');
      expect(usePreferenceStore.getState().defaultView).toBe('kanban');
    });
  });

  describe('showCompleted', () => {
    it('should toggle show completed', () => {
      usePreferenceStore.getState().toggleShowCompleted();
      expect(usePreferenceStore.getState().showCompleted).toBe(true);

      usePreferenceStore.getState().toggleShowCompleted();
      expect(usePreferenceStore.getState().showCompleted).toBe(false);
    });

    it('should set show completed explicitly', () => {
      usePreferenceStore.getState().setShowCompleted(true);
      expect(usePreferenceStore.getState().showCompleted).toBe(true);
    });
  });

  describe('pageSize', () => {
    it('should set page size', () => {
      usePreferenceStore.getState().setPageSize(50);
      expect(usePreferenceStore.getState().pageSize).toBe(50);
    });
  });

  describe('compactMode', () => {
    it('should toggle compact mode', () => {
      usePreferenceStore.getState().toggleCompactMode();
      expect(usePreferenceStore.getState().compactMode).toBe(true);
    });

    it('should set compact mode explicitly', () => {
      usePreferenceStore.getState().setCompactMode(true);
      expect(usePreferenceStore.getState().compactMode).toBe(true);
    });
  });

  describe('notificationSound', () => {
    it('should toggle notification sound', () => {
      usePreferenceStore.getState().toggleNotificationSound();
      expect(usePreferenceStore.getState().notificationSound).toBe(false);
    });

    it('should set notification sound explicitly', () => {
      usePreferenceStore.getState().setNotificationSound(false);
      expect(usePreferenceStore.getState().notificationSound).toBe(false);
    });
  });

  describe('resetPreferences', () => {
    it('should reset all preferences to defaults', () => {
      // Change everything
      usePreferenceStore.getState().setTheme('dark');
      usePreferenceStore.getState().setDefaultView('kanban');
      usePreferenceStore.getState().setShowCompleted(true);
      usePreferenceStore.getState().setPageSize(100);
      usePreferenceStore.getState().setCompactMode(true);
      usePreferenceStore.getState().setNotificationSound(false);

      // Reset
      usePreferenceStore.getState().resetPreferences();

      const state = usePreferenceStore.getState();
      expect(state.theme).toBe('system');
      expect(state.defaultView).toBe('list');
      expect(state.showCompleted).toBe(false);
      expect(state.pageSize).toBe(25);
      expect(state.compactMode).toBe(false);
      expect(state.notificationSound).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should persist preferences to localStorage', () => {
      usePreferenceStore.getState().setTheme('dark');

      // The zustand persist middleware writes to localStorage
      const stored = localStorage.getItem('openclaw-preferences');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
    });
  });
});
