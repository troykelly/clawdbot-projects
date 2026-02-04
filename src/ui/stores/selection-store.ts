/**
 * Selection state store using Zustand.
 *
 * Manages selected work items for bulk operations and active filters
 * for the work items list / kanban views.
 */
import { create } from 'zustand';

/** Filter criteria applied to work item lists. */
export interface WorkItemFilters {
  status?: string[];
  priority?: string[];
  kind?: string[];
  search?: string;
}

export interface SelectionState {
  /** Set of currently selected work item IDs. */
  selectedIds: Set<string>;
  /** Active filters for work item lists. */
  filters: WorkItemFilters;
}

export interface SelectionActions {
  /** Select a single work item (add to selection). */
  select: (id: string) => void;
  /** Deselect a single work item (remove from selection). */
  deselect: (id: string) => void;
  /** Toggle selection of a single work item. */
  toggleSelection: (id: string) => void;
  /** Select multiple work items at once. */
  selectMany: (ids: string[]) => void;
  /** Select all from a provided list of IDs. */
  selectAll: (ids: string[]) => void;
  /** Clear the entire selection. */
  clearSelection: () => void;
  /** Check if a specific ID is selected. */
  isSelected: (id: string) => boolean;
  /** Set filters (merges with existing). */
  setFilters: (filters: Partial<WorkItemFilters>) => void;
  /** Clear all filters. */
  clearFilters: () => void;
  /** Set a specific filter value. */
  setFilter: <K extends keyof WorkItemFilters>(key: K, value: WorkItemFilters[K]) => void;
}

export type SelectionStore = SelectionState & SelectionActions;

/**
 * Zustand store for work item selection and filter state.
 *
 * Usage:
 * ```ts
 * const selectedIds = useSelectionStore(s => s.selectedIds);
 * const toggleSelection = useSelectionStore(s => s.toggleSelection);
 * ```
 */
export const useSelectionStore = create<SelectionStore>((set, get) => ({
  // State
  selectedIds: new Set<string>(),
  filters: {},

  // Selection actions
  select: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next };
    }),

  deselect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.delete(id);
      return { selectedIds: next };
    }),

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),

  selectMany: (ids) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      for (const id of ids) {
        next.add(id);
      }
      return { selectedIds: next };
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  isSelected: (id) => get().selectedIds.has(id),

  // Filter actions
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
}));
