/**
 * Lexical editor theme configuration.
 * Part of Epic #338, Issue #757
 *
 * Provides styling for editor content including text formatting,
 * headings, lists, links, code blocks, and tables.
 */

export const theme = {
  ltr: 'text-left',
  rtl: 'text-right',
  paragraph: 'mb-2',
  quote: 'border-l-4 border-muted-foreground/30 pl-4 my-2 italic',
  heading: {
    h1: 'text-2xl font-bold mt-6 mb-3',
    h2: 'text-xl font-semibold mt-6 mb-2',
    h3: 'text-lg font-semibold mt-4 mb-2',
    h4: 'text-base font-semibold mt-4 mb-1',
    h5: 'text-sm font-semibold mt-3 mb-1',
    h6: 'text-sm font-semibold mt-3 mb-1',
  },
  list: {
    nested: {
      listitem: 'ml-4',
    },
    ol: 'list-decimal ml-4',
    ul: 'list-disc ml-4',
    listitem: 'my-1',
  },
  link: 'text-primary underline cursor-pointer hover:text-primary/80',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
  },
  code: 'bg-muted p-3 rounded-md overflow-x-auto my-3 font-mono text-sm block',
  // Table styling
  table: 'border-collapse border border-border my-4 w-full',
  tableRow: 'border-b border-border',
  tableCell: 'border border-border p-2 text-sm',
  tableCellHeader: 'bg-muted font-semibold border border-border p-2 text-sm',
  // Code highlight token classes for Prism/Lexical syntax highlighting
  codeHighlight: {
    atrule: 'text-purple-600 dark:text-purple-400',
    attr: 'text-yellow-600 dark:text-yellow-400',
    boolean: 'text-purple-600 dark:text-purple-400',
    builtin: 'text-cyan-600 dark:text-cyan-400',
    cdata: 'text-gray-500 dark:text-gray-400',
    char: 'text-green-600 dark:text-green-400',
    class: 'text-yellow-600 dark:text-yellow-400',
    'class-name': 'text-yellow-600 dark:text-yellow-400',
    comment: 'text-gray-500 dark:text-gray-400 italic',
    constant: 'text-purple-600 dark:text-purple-400',
    deleted: 'text-red-600 dark:text-red-400',
    doctype: 'text-gray-500 dark:text-gray-400',
    entity: 'text-red-600 dark:text-red-400',
    function: 'text-blue-600 dark:text-blue-400',
    important: 'text-red-600 dark:text-red-400 font-bold',
    inserted: 'text-green-600 dark:text-green-400',
    keyword: 'text-purple-600 dark:text-purple-400',
    namespace: 'text-gray-600 dark:text-gray-400',
    number: 'text-orange-600 dark:text-orange-400',
    operator: 'text-pink-600 dark:text-pink-400',
    prolog: 'text-gray-500 dark:text-gray-400',
    property: 'text-blue-600 dark:text-blue-400',
    punctuation: 'text-gray-600 dark:text-gray-400',
    regex: 'text-orange-600 dark:text-orange-400',
    selector: 'text-green-600 dark:text-green-400',
    string: 'text-green-600 dark:text-green-400',
    symbol: 'text-purple-600 dark:text-purple-400',
    tag: 'text-red-600 dark:text-red-400',
    url: 'text-cyan-600 dark:text-cyan-400',
    variable: 'text-orange-600 dark:text-orange-400',
  },
};

/**
 * Error handler for Lexical editor.
 * Logs errors in development only to avoid information leakage in production (#676).
 */
export function onError(error: Error): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[LexicalEditor]', error);
  }
}
