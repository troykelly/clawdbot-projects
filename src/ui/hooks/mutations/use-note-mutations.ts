/**
 * TanStack Query mutation hooks for notes.
 *
 * Provides mutations for creating, updating, deleting, and restoring notes.
 * Includes cache invalidation for related queries.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, type ApiRequestError } from '@/ui/lib/api-client.ts';
import type {
  Note,
  CreateNoteBody,
  UpdateNoteBody,
  RestoreVersionResponse,
} from '@/ui/lib/api-types.ts';
import { noteKeys } from '@/ui/hooks/queries/use-notes.ts';
import { notebookKeys } from '@/ui/hooks/queries/use-notebooks.ts';

/**
 * Options for useCreateNote mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseCreateNoteOptions = Omit<
  UseMutationOptions<Note, ApiRequestError, CreateNoteBody>,
  'mutationFn'
>;

/**
 * Create a new note.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useCreateNote({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ title: 'New note', content: '# Hello' });
 * ```
 */
export function useCreateNote(options?: UseCreateNoteOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateNoteBody) =>
      apiClient.post<Note>('/api/notes', body),

    onSuccess: (note, variables, context) => {
      // Invalidate notes list queries
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // If note has a notebook, invalidate notebook queries too
      if (note.notebookId) {
        queryClient.invalidateQueries({
          queryKey: notebookKeys.detail(note.notebookId),
        });
        queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });
      }

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(note, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useUpdateNote mutation. */
export interface UpdateNoteVariables {
  /** The note ID to update. */
  id: string;
  /** Partial update body. */
  body: UpdateNoteBody;
}

/**
 * Options for useUpdateNote mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseUpdateNoteOptions = Omit<
  UseMutationOptions<Note, ApiRequestError, UpdateNoteVariables>,
  'mutationFn'
>;

/**
 * Update an existing note.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useUpdateNote({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ id: 'note-123', body: { title: 'Updated title' } });
 * ```
 */
export function useUpdateNote(options?: UseUpdateNoteOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: UpdateNoteVariables) =>
      apiClient.put<Note>(`/api/notes/${encodeURIComponent(id)}`, body),

    onSuccess: (note, variables, context) => {
      const { id } = variables;

      // Invalidate the specific note detail
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });

      // Invalidate notes list queries
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Invalidate versions since content may have changed
      queryClient.invalidateQueries({ queryKey: noteKeys.versions(id) });

      // If note has a notebook, invalidate notebook queries
      if (note.notebookId) {
        queryClient.invalidateQueries({
          queryKey: notebookKeys.detail(note.notebookId),
        });
        queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });
      }

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(note, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/**
 * Options for useDeleteNote mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseDeleteNoteOptions = Omit<
  UseMutationOptions<void, ApiRequestError, string>,
  'mutationFn'
>;

/**
 * Soft delete a note.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useDeleteNote({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate('note-123');
 * ```
 */
export function useDeleteNote(options?: UseDeleteNoteOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/notes/${encodeURIComponent(id)}`),

    onSuccess: (result, id, context) => {
      // Invalidate the specific note detail
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });

      // Invalidate notes list queries
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Invalidate notebook tree to update counts
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, id, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/**
 * Options for useRestoreNote mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseRestoreNoteOptions = Omit<
  UseMutationOptions<Note, ApiRequestError, string>,
  'mutationFn'
>;

/**
 * Restore a soft-deleted note.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useRestoreNote({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate('note-123');
 * ```
 */
export function useRestoreNote(options?: UseRestoreNoteOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Note>(
        `/api/notes/${encodeURIComponent(id)}/restore`,
        {}
      ),

    onSuccess: (note, id, context) => {
      // Invalidate the specific note detail
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });

      // Invalidate notes list queries
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // If note has a notebook, invalidate notebook queries
      if (note.notebookId) {
        queryClient.invalidateQueries({
          queryKey: notebookKeys.detail(note.notebookId),
        });
        queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });
      }

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(note, id, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useRestoreNoteVersion mutation. */
export interface RestoreNoteVersionVariables {
  /** The note ID. */
  id: string;
  /** The version number to restore. */
  versionNumber: number;
}

/**
 * Options for useRestoreNoteVersion mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseRestoreNoteVersionOptions = Omit<
  UseMutationOptions<
    RestoreVersionResponse,
    ApiRequestError,
    RestoreNoteVersionVariables
  >,
  'mutationFn'
>;

/**
 * Restore a note to a previous version.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useRestoreNoteVersion({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ id: 'note-123', versionNumber: 5 });
 * ```
 */
export function useRestoreNoteVersion(options?: UseRestoreNoteVersionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, versionNumber }: RestoreNoteVersionVariables) =>
      apiClient.post<RestoreVersionResponse>(
        `/api/notes/${encodeURIComponent(id)}/versions/${versionNumber}/restore`,
        {}
      ),

    onSuccess: (result, variables, context) => {
      const { id } = variables;

      // Invalidate note detail and versions
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.versions(id) });

      // Invalidate notes list queries
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}
