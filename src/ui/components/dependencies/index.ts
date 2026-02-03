/**
 * Dependency management components
 * Issue #390: Implement dependency creation UI
 */
export { AddDependencyDialog } from './add-dependency-dialog';
export type { AddDependencyDialogProps } from './add-dependency-dialog';
export { DependencyItem } from './dependency-item';
export type { DependencyItemProps } from './dependency-item';
export {
  detectCircularDependency,
  getDependencyTypeLabel,
  getDependencyTypeDescription,
  isValidDependency,
  buildDependencyGraph,
  type DependencyGraph,
} from './dependency-utils';
export type {
  DependencyType,
  DependencyDirection,
  WorkItemSummary,
  Dependency,
  CreateDependencyParams,
} from './types';
