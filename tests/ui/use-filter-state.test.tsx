/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState, filtersToSearchParams, searchParamsToFilters } from '@/ui/components/filter-bar/use-filter-state';
import type { FilterState } from '@/ui/components/filter-bar/types';

describe('filtersToSearchParams', () => {
  it('converts empty filters to empty params', () => {
    const params = filtersToSearchParams({});
    expect(params.toString()).toBe('');
  });

  it('converts array filters to multiple params', () => {
    const filters: FilterState = {
      status: ['in_progress', 'blocked'],
    };
    const params = filtersToSearchParams(filters);
    expect(params.getAll('status')).toEqual(['in_progress', 'blocked']);
  });

  it('converts boolean filters to string', () => {
    const filters: FilterState = {
      hasDescription: true,
      hasEstimate: false,
    };
    const params = filtersToSearchParams(filters);
    expect(params.get('hasDescription')).toBe('true');
    expect(params.get('hasEstimate')).toBe('false');
  });

  it('converts string filters directly', () => {
    const filters: FilterState = {
      search: 'my query',
    };
    const params = filtersToSearchParams(filters);
    expect(params.get('search')).toBe('my query');
  });
});

describe('searchParamsToFilters', () => {
  it('converts empty params to empty filters', () => {
    const params = new URLSearchParams('');
    const filters = searchParamsToFilters(params);
    expect(filters).toEqual({});
  });

  it('converts multi-value params to arrays', () => {
    const params = new URLSearchParams('status=in_progress&status=blocked');
    const filters = searchParamsToFilters(params);
    expect(filters.status).toEqual(['in_progress', 'blocked']);
  });

  it('converts boolean params correctly', () => {
    const params = new URLSearchParams('hasDescription=true&hasEstimate=false');
    const filters = searchParamsToFilters(params);
    expect(filters.hasDescription).toBe(true);
    expect(filters.hasEstimate).toBe(false);
  });

  it('converts search param directly', () => {
    const params = new URLSearchParams('search=my+query');
    const filters = searchParamsToFilters(params);
    expect(filters.search).toBe('my query');
  });
});

describe('useFilterState', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
    });

    // Mock window.location
    vi.stubGlobal('location', {
      pathname: '/app/work-items',
      search: '',
    });

    // Mock window.history
    vi.stubGlobal('history', {
      pushState: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useFilterState());
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('initializes with provided filters', () => {
    const initialFilters: FilterState = { status: ['in_progress'] };
    const { result } = renderHook(() => useFilterState(initialFilters));
    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('updates filters when setFilters is called', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setFilters({ status: ['in_progress'] });
    });

    expect(result.current.filters).toEqual({ status: ['in_progress'] });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('clears filters when clearFilters is called', () => {
    const initialFilters: FilterState = { status: ['in_progress'], priority: ['high'] };
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('saves filter to localStorage', () => {
    const { result } = renderHook(() => useFilterState());

    // Set filters first
    act(() => {
      result.current.setFilters({ status: ['in_progress'] });
    });

    // Then save in a separate act
    act(() => {
      result.current.saveFilter('My Filter');
    });

    expect(result.current.savedFilters).toHaveLength(1);
    expect(result.current.savedFilters[0].name).toBe('My Filter');
    expect(result.current.savedFilters[0].filters).toEqual({ status: ['in_progress'] });
  });

  it('deletes saved filter', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setFilters({ status: ['in_progress'] });
    });

    let filterId: string;
    act(() => {
      const saved = result.current.saveFilter('My Filter');
      filterId = saved.id;
    });

    expect(result.current.savedFilters).toHaveLength(1);

    act(() => {
      result.current.deleteFilter(filterId!);
    });

    expect(result.current.savedFilters).toHaveLength(0);
  });

  it('applies saved filter', () => {
    const { result } = renderHook(() => useFilterState());

    // Save a filter first
    act(() => {
      result.current.setFilters({ status: ['in_progress'] });
    });

    let savedFilter: { id: string; name: string; filters: FilterState };
    act(() => {
      savedFilter = result.current.saveFilter('My Filter');
    });

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});

    // Apply the saved filter
    act(() => {
      result.current.applyFilter(savedFilter!);
    });

    expect(result.current.filters).toEqual({ status: ['in_progress'] });
  });

  it('generates correct query string', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.setFilters({
        status: ['in_progress', 'blocked'],
        priority: ['high'],
      });
    });

    expect(result.current.queryString).toContain('status=in_progress');
    expect(result.current.queryString).toContain('status=blocked');
    expect(result.current.queryString).toContain('priority=high');
  });
});
