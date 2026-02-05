/**
 * TanStack Query mutation hooks for note sharing.
 *
 * Provides mutations for creating, updating, and revoking note shares.
 * Includes cache invalidation for related queries.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, type ApiRequestError } from '@/ui/lib/api-client.ts';
import type {
  NoteUserShare,
  CreateUserShareBody,
  CreateLinkShareBody,
  CreateLinkShareResponse,
  UpdateShareBody,
  NoteShare,
} from '@/ui/lib/api-types.ts';
import { noteKeys } from '@/ui/hooks/queries/use-notes.ts';

/** Variables for useShareNoteWithUser mutation. */
export interface ShareNoteWithUserVariables {
  /** The note ID to share. */
  noteId: string;
  /** Share configuration. */
  body: CreateUserShareBody;
}

/**
 * Options for useShareNoteWithUser mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseShareNoteWithUserOptions = Omit<
  UseMutationOptions<NoteUserShare, ApiRequestError, ShareNoteWithUserVariables>,
  'mutationFn'
>;

/**
 * Share a note with a specific user.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useShareNoteWithUser({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ noteId: 'note-123', body: { email: 'user@example.com', permission: 'read' } });
 * ```
 */
export function useShareNoteWithUser(options?: UseShareNoteWithUserOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, body }: ShareNoteWithUserVariables) =>
      apiClient.post<NoteUserShare>(
        `/api/notes/${encodeURIComponent(noteId)}/share`,
        body
      ),

    onSuccess: (result, variables, context) => {
      const { noteId } = variables;

      // Invalidate shares for this note
      queryClient.invalidateQueries({ queryKey: noteKeys.shares(noteId) });

      // Invalidate the note detail (visibility may have changed)
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useCreateNoteShareLink mutation. */
export interface CreateNoteShareLinkVariables {
  /** The note ID to create a share link for. */
  noteId: string;
  /** Share link configuration. */
  body: CreateLinkShareBody;
}

/**
 * Options for useCreateNoteShareLink mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseCreateNoteShareLinkOptions = Omit<
  UseMutationOptions<
    CreateLinkShareResponse,
    ApiRequestError,
    CreateNoteShareLinkVariables
  >,
  'mutationFn'
>;

/**
 * Create a shareable link for a note.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useCreateNoteShareLink({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ noteId: 'note-123', body: { permission: 'read', maxViews: 10 } });
 * ```
 */
export function useCreateNoteShareLink(options?: UseCreateNoteShareLinkOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, body }: CreateNoteShareLinkVariables) =>
      apiClient.post<CreateLinkShareResponse>(
        `/api/notes/${encodeURIComponent(noteId)}/share/link`,
        body
      ),

    onSuccess: (result, variables, context) => {
      const { noteId } = variables;

      // Invalidate shares for this note
      queryClient.invalidateQueries({ queryKey: noteKeys.shares(noteId) });

      // Invalidate the note detail (visibility may have changed)
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useUpdateNoteShare mutation. */
export interface UpdateNoteShareVariables {
  /** The note ID. */
  noteId: string;
  /** The share ID to update. */
  shareId: string;
  /** Updated share configuration. */
  body: UpdateShareBody;
}

/**
 * Options for useUpdateNoteShare mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseUpdateNoteShareOptions = Omit<
  UseMutationOptions<NoteShare, ApiRequestError, UpdateNoteShareVariables>,
  'mutationFn'
>;

/**
 * Update an existing share's permission or expiration.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useUpdateNoteShare({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ noteId: 'note-123', shareId: 'share-456', body: { permission: 'read_write' } });
 * ```
 */
export function useUpdateNoteShare(options?: UseUpdateNoteShareOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, shareId, body }: UpdateNoteShareVariables) =>
      apiClient.put<NoteShare>(
        `/api/notes/${encodeURIComponent(noteId)}/shares/${encodeURIComponent(shareId)}`,
        body
      ),

    onSuccess: (result, variables, context) => {
      const { noteId } = variables;

      // Invalidate shares for this note
      queryClient.invalidateQueries({ queryKey: noteKeys.shares(noteId) });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}

/** Variables for useRevokeNoteShare mutation. */
export interface RevokeNoteShareVariables {
  /** The note ID. */
  noteId: string;
  /** The share ID to revoke. */
  shareId: string;
}

/**
 * Options for useRevokeNoteShare mutation.
 * Allows consumers to provide custom error handlers and other mutation options.
 */
export type UseRevokeNoteShareOptions = Omit<
  UseMutationOptions<void, ApiRequestError, RevokeNoteShareVariables>,
  'mutationFn'
>;

/**
 * Revoke a note share.
 *
 * @param options - Optional mutation configuration including onError callback
 * @returns TanStack mutation
 *
 * @example
 * ```ts
 * const { mutate } = useRevokeNoteShare({
 *   onError: (error) => toast.error(error.message),
 * });
 * mutate({ noteId: 'note-123', shareId: 'share-456' });
 * ```
 */
export function useRevokeNoteShare(options?: UseRevokeNoteShareOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, shareId }: RevokeNoteShareVariables) =>
      apiClient.delete(
        `/api/notes/${encodeURIComponent(noteId)}/shares/${encodeURIComponent(shareId)}`
      ),

    onSuccess: (result, variables, context) => {
      const { noteId } = variables;

      // Invalidate shares for this note
      queryClient.invalidateQueries({ queryKey: noteKeys.shares(noteId) });

      // Invalidate the note detail (visibility may have changed)
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) });

      // Invalidate shared-with-me in case this was a share we were receiving
      queryClient.invalidateQueries({ queryKey: noteKeys.sharedWithMe() });

      // Call consumer's onSuccess if provided
      options?.onSuccess?.(result, variables, context);
    },

    onError: options?.onError,
    onSettled: options?.onSettled,
    ...options,
  });
}
