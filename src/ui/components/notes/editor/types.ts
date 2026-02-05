/**
 * TypeScript types and interfaces for the Lexical note editor.
 * Part of Epic #338, Issue #757
 */

export type EditorMode = 'wysiwyg' | 'markdown' | 'preview';

export interface LexicalEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  mode?: EditorMode;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  saving?: boolean;
}

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
}

export interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rows: number, columns: number) => void;
}

export interface MermaidRendererProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDark?: boolean;
}

export interface ToolbarPluginProps {
  onSave?: () => void;
  saving?: boolean;
}

export interface InitialContentPluginProps {
  initialContent: string;
}

export interface ContentSyncPluginProps {
  onChange?: (content: string) => void;
  onSave?: () => void;
}
