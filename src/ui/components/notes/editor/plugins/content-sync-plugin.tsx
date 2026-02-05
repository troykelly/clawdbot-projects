/**
 * Plugin to sync content changes and handle save shortcut.
 * Part of Epic #338, Issue #757
 */

import React, { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import type { EditorState } from 'lexical';
import type { ContentSyncPluginProps } from '../types';

export function ContentSyncPlugin({
  onChange,
  onSave,
}: ContentSyncPluginProps): React.JSX.Element {
  const [editor] = useLexicalComposerContext();

  // Handle Ctrl+S for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Export to markdown on change
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange?.(markdown);
      });
    },
    [onChange]
  );

  return (
    <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
  );
}
