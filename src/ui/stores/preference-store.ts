/**
 * User preference store with localStorage persistence.
 *
 * Uses Zustand's persist middleware to automatically save and restore
 * user preferences across browser sessions.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** View mode for work item lists. */
export type ViewMode = 'list' | 'grid' | 'kanban';

/** Theme preference. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface PreferenceState {
  /** Preferred theme. */
  theme: ThemePreference;
  /** Default view mode for work item lists. */
  defaultView: ViewMode;
  /** Whether to show completed items in lists. */
  showCompleted: boolean;
  /** Number of items per page in lists. */
  pageSize: number;
  /** Whether compact mode is enabled (denser UI). */
  compactMode: boolean;
  /** Whether notification sound is enabled. */
  notificationSound: boolean;
}

export interface PreferenceActions {
  /** Set the preferred theme. */
  setTheme: (theme: ThemePreference) => void;
  /** Set the default view mode. */
  setDefaultView: (view: ViewMode) => void;
  /** Toggle showing completed items. */
  toggleShowCompleted: () => void;
  /** Set showing completed items explicitly. */
  setShowCompleted: (show: boolean) => void;
  /** Set page size. */
  setPageSize: (size: number) => void;
  /** Toggle compact mode. */
  toggleCompactMode: () => void;
  /** Set compact mode explicitly. */
  setCompactMode: (compact: boolean) => void;
  /** Toggle notification sound. */
  toggleNotificationSound: () => void;
  /** Set notification sound explicitly. */
  setNotificationSound: (enabled: boolean) => void;
  /** Reset all preferences to defaults. */
  resetPreferences: () => void;
}

export type PreferenceStore = PreferenceState & PreferenceActions;

/** Default preference values. */
const DEFAULT_PREFERENCES: PreferenceState = {
  theme: 'system',
  defaultView: 'list',
  showCompleted: false,
  pageSize: 25,
  compactMode: false,
  notificationSound: true,
};

/**
 * Zustand store for persisted user preferences.
 *
 * Automatically saves to localStorage under key 'openclaw-preferences'.
 *
 * Usage:
 * ```ts
 * const theme = usePreferenceStore(s => s.theme);
 * const setTheme = usePreferenceStore(s => s.setTheme);
 * ```
 */
export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      // State (defaults)
      ...DEFAULT_PREFERENCES,

      // Actions
      setTheme: (theme) => set({ theme }),
      setDefaultView: (defaultView) => set({ defaultView }),
      toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),
      setShowCompleted: (showCompleted) => set({ showCompleted }),
      setPageSize: (pageSize) => set({ pageSize }),
      toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
      setCompactMode: (compactMode) => set({ compactMode }),
      toggleNotificationSound: () => set((state) => ({ notificationSound: !state.notificationSound })),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      resetPreferences: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'openclaw-preferences',
    },
  ),
);
