/**
 * TanStack Query mutation hooks for notebooks.
 *
 * Provides mutations for creating, updating, archiving, and deleting notebooks.
 * Includes cache invalidation for related queries.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, type ApiRequestError } from '@/ui/lib/api-client.ts';
import type {
  Notebook,
  CreateNotebookBody,
  UpdateNotebookBody,
  MoveNotesBody,
  MoveNotesResponse,
} from '@/ui/lib/api-types.ts';
import { noteKeys } from '@/ui/hooks/queries/use-notes.ts';
import { notebookKeys } from '@/ui/hooks/queries/use-notebooks.ts';

/**
 * Options for useCreateNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseCreateNotebookOptions = Omit<
  UseMutationOptions<Notebook, ApiRequestError, CreateNotebookBody>,
  'mutationFn'
>;

/**
 * Create a new notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useCreateNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ name: 'My Notebook', icon: '📓' });
 * ```
 */
export function useCreateNotebook(options?: UseCreateNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateNotebookBody) =>
      apiClient.post<Notebook>('/api/notebooks', body),

    onSuccess: (notebook, variables, context) => {
      // Invalidate notebooks list queries
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Invalidate tree
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // If has parent, invalidate parent notebook
      if (notebook.parentNotebookId) {
        queryClient.invalidateQueries({
          queryKey: notebookKeys.detail(notebook.parentNotebookId),
        });
      }

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(notebook, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useUpdateNotebook mutation. */
export interface UpdateNotebookVariables {
  /** The notebook ID to update. */
  id: string;
  /** Partial update body. */
  body: UpdateNotebookBody;
}

/**
 * Options for useUpdateNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseUpdateNotebookOptions = Omit<
  UseMutationOptions<Notebook, ApiRequestError, UpdateNotebookVariables>,
  'mutationFn'
>;

/**
 * Update an existing notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useUpdateNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ id: 'notebook-123', body: { name: 'New Name' } });
 * ```
 */
export function useUpdateNotebook(options?: UseUpdateNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: UpdateNotebookVariables) =>
      apiClient.put<Notebook>(
        `/api/notebooks/${encodeURIComponent(id)}`,
        body
      ),

    onSuccess: (result, variables, context) => {
      const { id } = variables;

      // Invalidate the specific notebook detail
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(id) });

      // Invalidate notebooks list queries
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Invalidate tree
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/**
 * Options for useArchiveNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseArchiveNotebookOptions = Omit<
  UseMutationOptions<Notebook, ApiRequestError, string>,
  'mutationFn'
>;

/**
 * Archive a notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useArchiveNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate('notebook-123');
 * ```
 */
export function useArchiveNotebook(options?: UseArchiveNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Notebook>(
        `/api/notebooks/${encodeURIComponent(id)}/archive`,
        {}
      ),

    onSuccess: (result, id, context) => {
      // Invalidate the specific notebook detail
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(id) });

      // Invalidate notebooks list queries
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Invalidate tree
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, id, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/**
 * Options for useUnarchiveNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseUnarchiveNotebookOptions = Omit<
  UseMutationOptions<Notebook, ApiRequestError, string>,
  'mutationFn'
>;

/**
 * Unarchive a notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useUnarchiveNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate('notebook-123');
 * ```
 */
export function useUnarchiveNotebook(options?: UseUnarchiveNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Notebook>(
        `/api/notebooks/${encodeURIComponent(id)}/unarchive`,
        {}
      ),

    onSuccess: (result, id, context) => {
      // Invalidate the specific notebook detail
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(id) });

      // Invalidate notebooks list queries
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Invalidate tree
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, id, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useDeleteNotebook mutation. */
export interface DeleteNotebookVariables {
  /** The notebook ID to delete. */
  id: string;
  /** Whether to delete notes in the notebook. Defaults to false (moves notes to inbox). */
  deleteNotes?: boolean;
}

/**
 * Options for useDeleteNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseDeleteNotebookOptions = Omit<
  UseMutationOptions<void, ApiRequestError, DeleteNotebookVariables>,
  'mutationFn'
>;

/**
 * Delete a notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useDeleteNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ id: 'notebook-123', deleteNotes: false });
 * ```
 */
export function useDeleteNotebook(options?: UseDeleteNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deleteNotes = false }: DeleteNotebookVariables) =>
      apiClient.delete(
        `/api/notebooks/${encodeURIComponent(id)}${deleteNotes ? '?deleteNotes=true' : ''}`
      ),

    onSuccess: (result, variables, context) => {
      const { id } = variables;

      // Invalidate the specific notebook detail
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(id) });

      // Invalidate notebooks list queries
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });

      // Invalidate tree
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // Also invalidate notes since they may have been moved or deleted
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useMoveNotesToNotebook mutation. */
export interface MoveNotesToNotebookVariables {
  /** The target notebook ID. */
  notebookId: string;
  /** Move/copy configuration. */
  body: MoveNotesBody;
}

/**
 * Options for useMoveNotesToNotebook mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseMoveNotesToNotebookOptions = Omit<
  UseMutationOptions<
    MoveNotesResponse,
    ApiRequestError,
    MoveNotesToNotebookVariables
  >,
  'mutationFn'
>;

/**
 * Move or copy notes to a notebook.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useMoveNotesToNotebook({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ notebookId: 'notebook-123', body: { noteIds: ['note-1', 'note-2'], action: 'move' } });
 * ```
 */
export function useMoveNotesToNotebook(options?: UseMoveNotesToNotebookOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notebookId, body }: MoveNotesToNotebookVariables) =>
      apiClient.post<MoveNotesResponse>(
        `/api/notebooks/${encodeURIComponent(notebookId)}/notes`,
        body
      ),

    onSuccess: (result, variables, context) => {
      const { notebookId } = variables;

      // Invalidate the target notebook
      queryClient.invalidateQueries({
        queryKey: notebookKeys.detail(notebookId),
      });

      // Invalidate all notebooks (source notebook may have changed)
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notebookKeys.tree() });

      // Invalidate notes since they've been moved/copied
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}
