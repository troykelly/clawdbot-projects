/**
 * Import/export components
 * Issue #398: Implement contact import/export (CSV, vCard)
 */
export { ImportDialog } from './import-dialog';
export type { ImportDialogProps } from './import-dialog';
export { ColumnMapper } from './column-mapper';
export type { ColumnMapperProps } from './column-mapper';
export { ImportPreview } from './import-preview';
export type { ImportPreviewProps } from './import-preview';
export { ImportSummary } from './import-summary';
export type { ImportSummaryProps } from './import-summary';
export { ExportDialog } from './export-dialog';
export type { ExportDialogProps } from './export-dialog';
export type {
  ImportFormat,
  ExportFormat,
  ExportScope,
  DuplicateHandling,
  ContactField,
  ColumnMapping,
  ParsedContact,
  CSVParseResult,
  ImportError,
  ImportResult,
  ExportFieldOption,
} from './types';
export {
  parseCSV,
  parseVCard,
  autoMapColumns,
  exportToCSV,
  exportToVCard,
  CONTACT_FIELDS,
} from './import-export-utils';
