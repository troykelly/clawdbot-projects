/**
 * Types for contact import/export
 * Issue #398: Implement contact import/export (CSV, vCard)
 */

/** Import formats */
export type ImportFormat = 'csv' | 'vcard';

/** Export formats */
export type ExportFormat = 'csv' | 'vcard' | 'json';

/** Export scope */
export type ExportScope = 'all' | 'selected';

/** Duplicate handling strategy */
export type DuplicateHandling = 'skip' | 'update' | 'create';

/** Target contact fields */
export type ContactField = 'name' | 'email' | 'phone' | 'organization' | 'role' | 'notes' | 'skip';

/** Column mapping */
export interface ColumnMapping {
  sourceColumn: string;
  targetField: ContactField | null;
  autoMapped?: boolean;
}

/** Parsed contact from import */
export interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  role?: string;
  notes?: string;
  [key: string]: string | undefined;
}

/** CSV parse result */
export interface CSVParseResult {
  headers: string[];
  rows: ParsedContact[];
}

/** Import error detail */
export interface ImportError {
  row: number;
  message: string;
}

/** Import result summary */
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: ImportError[];
}

/** Export field option */
export interface ExportFieldOption {
  id: ContactField;
  label: string;
  selected: boolean;
}
