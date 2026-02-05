/**
 * Note editor exports.
 * Part of Epic #338, Issues #350, #629, #757
 */

export { NoteEditor, type NoteEditorProps, type EditorMode } from './note-editor';

// Also export the Lexical editor directly if needed
export { LexicalNoteEditor, type LexicalEditorProps } from './lexical-editor';

// Export modular components for advanced usage
export { ToolbarPlugin } from './plugins/toolbar-plugin';
export { InitialContentPlugin } from './plugins/initial-content-plugin';
export { ContentSyncPlugin } from './plugins/content-sync-plugin';
export { AutoFocusPlugin } from './plugins/auto-focus-plugin';
export { CodeHighlightPlugin } from './plugins/code-highlight-plugin';

export { LinkDialog } from './dialogs/link-dialog';
export { TableDialog } from './dialogs/table-dialog';

export { ToolbarButton } from './components/toolbar-button';
export { ToolbarSeparator } from './components/toolbar-separator';
export { MermaidRenderer } from './components/mermaid-renderer';

export { theme, onError } from './config/theme';

export { sanitizeHtml, escapeHtml, DOMPURIFY_CONFIG } from './utils/sanitize';
export { markdownToHtml } from './utils/markdown-to-html';
export { highlightCode, loadLanguage, getOrLoadLanguage } from './utils/highlight';
export { validateUrl, normalizeUrl, ALLOWED_PROTOCOLS } from './utils/url-validation';

// Export all types
export type {
  ToolbarButtonProps,
  LinkDialogProps,
  TableDialogProps,
  MermaidRendererProps,
  ToolbarPluginProps,
  InitialContentPluginProps,
  ContentSyncPluginProps,
} from './types';
