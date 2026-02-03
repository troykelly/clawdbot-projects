/**
 * Workload and resource allocation components
 * Issue #392: Implement resource allocation and workload view
 */
export { TeamMemberCard } from './team-member-card';
export type { TeamMemberCardProps } from './team-member-card';
export { WorkloadBar } from './workload-bar';
export type { WorkloadBarProps, WorkloadSegment } from './workload-bar';
export { CapacityIndicator } from './capacity-indicator';
export type { CapacityIndicatorProps } from './capacity-indicator';
export {
  calculateUtilization,
  calculateWorkload,
  detectOverallocation,
  formatHours,
  getUtilizationStatus,
  getWorkloadSummary,
  type TeamMember,
  type WorkAssignment,
  type WorkloadSummary,
} from './workload-utils';
