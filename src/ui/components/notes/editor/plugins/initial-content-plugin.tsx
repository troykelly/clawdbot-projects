/**
 * Plugin to initialize editor with markdown content.
 * Part of Epic #338, Issue #757
 */

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import type { InitialContentPluginProps } from '../types';

export function InitialContentPlugin({
  initialContent,
}: InitialContentPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !initialContent) return;

    editor.update(() => {
      $convertFromMarkdownString(initialContent, TRANSFORMERS);
    });
    setInitialized(true);
  }, [editor, initialContent, initialized]);

  return null;
}
