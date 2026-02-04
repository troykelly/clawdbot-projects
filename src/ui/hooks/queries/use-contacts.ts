/**
 * TanStack Query hook for contacts.
 *
 * Fetches contacts list from GET /api/contacts with optional search.
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/ui/lib/api-client.ts';
import type { ContactsResponse } from '@/ui/lib/api-types.ts';

/** Query key factory for contacts. */
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (search?: string) => [...contactKeys.lists(), search] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const,
};

/**
 * Fetch the contacts list with optional search filtering.
 *
 * @param search - Optional search term
 * @returns TanStack Query result with `ContactsResponse`
 */
export function useContacts(search?: string) {
  const queryString = search
    ? `?search=${encodeURIComponent(search)}`
    : '';

  return useQuery({
    queryKey: contactKeys.list(search),
    queryFn: ({ signal }) =>
      apiClient.get<ContactsResponse>(`/api/contacts${queryString}`, { signal }),
  });
}
