/**
 * UI constants for the notes application.
 *
 * Centralizes magic values to improve maintainability and consistency.
 *
 * Part of Epic #338, Issue #662
 */

/**
 * Default color for new notebooks.
 * This is the indigo-500 color from Tailwind's palette.
 */
export const DEFAULT_NOTEBOOK_COLOR = '#6366f1';

/**
 * Color palette options for notebooks.
 * These are commonly used colors that work well for categorization.
 */
export const NOTEBOOK_COLOR_PALETTE = [
  '#6366f1', // indigo-500 (default)
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#64748b', // slate-500
] as const;

/**
 * Auto-dismiss timeout for temporary notifications (in milliseconds).
 */
export const NOTIFICATION_TIMEOUT_MS = 5000;
