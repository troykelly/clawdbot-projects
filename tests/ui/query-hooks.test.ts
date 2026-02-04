/**
 * Tests for TanStack Query hooks.
 *
 * Uses a test QueryClient wrapper to verify query behaviour,
 * cache key structure, and enabled logic.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkItems, useWorkItem, useWorkItemTree, workItemKeys } from '../../src/ui/hooks/queries/use-work-items.ts';
import { useProjects, projectKeys } from '../../src/ui/hooks/queries/use-projects.ts';
import { useActivity, activityKeys } from '../../src/ui/hooks/queries/use-activity.ts';
import { useContacts, contactKeys } from '../../src/ui/hooks/queries/use-contacts.ts';
import { useWorkItemMemories, useMemories, memoryKeys } from '../../src/ui/hooks/queries/use-memories.ts';
import { useNotifications, useUnreadNotificationCount, notificationKeys } from '../../src/ui/hooks/queries/use-notifications.ts';

// Save original fetch
const originalFetch = globalThis.fetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
}

function mockFetchResponse(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
  });
}

describe('Query Key Factories', () => {
  it('workItemKeys should produce correct key arrays', () => {
    expect(workItemKeys.all).toEqual(['work-items']);
    expect(workItemKeys.lists()).toEqual(['work-items', 'list']);
    expect(workItemKeys.list({ kind: 'project' })).toEqual(['work-items', 'list', { kind: 'project' }]);
    expect(workItemKeys.details()).toEqual(['work-items', 'detail']);
    expect(workItemKeys.detail('abc')).toEqual(['work-items', 'detail', 'abc']);
    expect(workItemKeys.tree()).toEqual(['work-items', 'tree']);
  });

  it('projectKeys should produce correct key arrays', () => {
    expect(projectKeys.all).toEqual(['projects']);
    expect(projectKeys.list()).toEqual(['projects', 'list']);
  });

  it('activityKeys should produce correct key arrays', () => {
    expect(activityKeys.all).toEqual(['activity']);
    expect(activityKeys.list(50)).toEqual(['activity', 'list', 50]);
  });

  it('contactKeys should produce correct key arrays', () => {
    expect(contactKeys.all).toEqual(['contacts']);
    expect(contactKeys.lists()).toEqual(['contacts', 'list']);
    expect(contactKeys.list('john')).toEqual(['contacts', 'list', 'john']);
    expect(contactKeys.detail('id-1')).toEqual(['contacts', 'detail', 'id-1']);
  });

  it('memoryKeys should produce correct key arrays', () => {
    expect(memoryKeys.all).toEqual(['memories']);
    expect(memoryKeys.lists()).toEqual(['memories', 'list']);
    expect(memoryKeys.forWorkItem('wi-1')).toEqual(['memories', 'work-item', 'wi-1']);
  });

  it('notificationKeys should produce correct key arrays', () => {
    expect(notificationKeys.all).toEqual(['notifications']);
    expect(notificationKeys.list()).toEqual(['notifications', 'list']);
    expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unread-count']);
  });
});

describe('useWorkItems', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch work items successfully', async () => {
    const data = { items: [{ id: '1', title: 'Test' }] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItems(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('should append filters to query string', async () => {
    const data = { items: [] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    renderHook(() => useWorkItems({ kind: 'project' }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/work-items?kind=project',
        expect.any(Object),
      );
    });
  });

  it('should handle error responses', async () => {
    mockFetchResponse({ message: 'Server error' }, 500);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItems(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useWorkItem', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch a single work item', async () => {
    const data = { id: 'abc', title: 'Test Item', status: 'open', priority: 'P2', kind: 'issue', created_at: '2026-01-01', updated_at: '2026-01-01' };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItem('abc'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('should not fetch when id is empty', async () => {
    mockFetchResponse({});

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItem(''), { wrapper: Wrapper });

    // Should remain in initial state since query is disabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('useWorkItemTree', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch the work item tree', async () => {
    const data = { items: [{ id: '1', title: 'Project', kind: 'project', children: [] }] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItemTree(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useProjects', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch projects (work items with kind=project)', async () => {
    const data = { items: [{ id: '1', title: 'My Project' }] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/work-items?kind=project',
      expect.any(Object),
    );
  });
});

describe('useActivity', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch activity with default limit', async () => {
    const data = { items: [{ id: '1', type: 'created' }] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useActivity(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/activity?limit=50',
      expect.any(Object),
    );
  });

  it('should fetch activity with custom limit', async () => {
    const data = { items: [] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    renderHook(() => useActivity(10), { wrapper: Wrapper });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/activity?limit=10',
        expect.any(Object),
      );
    });
  });
});

describe('useContacts', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch contacts without search', async () => {
    const data = { contacts: [], total: 0 };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useContacts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/contacts',
      expect.any(Object),
    );
  });

  it('should fetch contacts with search term', async () => {
    const data = { contacts: [{ id: '1', display_name: 'John' }], total: 1 };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    renderHook(() => useContacts('john'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/contacts?search=john',
        expect.any(Object),
      );
    });
  });
});

describe('useWorkItemMemories', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch memories for a work item', async () => {
    const data = { memories: [{ id: 'm1', title: 'Note' }] };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItemMemories('wi-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/work-items/wi-1/memories',
      expect.any(Object),
    );
  });

  it('should not fetch when workItemId is empty', async () => {
    mockFetchResponse({});

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkItemMemories(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useMemories', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch global memory list', async () => {
    const data = { memories: [], total: 0 };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMemories(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/memory',
      expect.any(Object),
    );
  });
});

describe('useNotifications', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch notifications', async () => {
    const data = { notifications: [], total: 0 };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/notifications',
      expect.any(Object),
    );
  });
});

describe('useUnreadNotificationCount', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should fetch unread count', async () => {
    const data = { count: 5 };
    mockFetchResponse(data);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ count: 5 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/notifications/unread-count',
      expect.any(Object),
    );
  });
});
