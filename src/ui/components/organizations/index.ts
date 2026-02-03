/**
 * Organization and contact group components
 * Issue #394: Implement contact groups and organization hierarchy
 */
export { OrganizationCard } from './organization-card';
export type { OrganizationCardProps } from './organization-card';
export { ContactGroupBadge } from './contact-group-badge';
export type { ContactGroupBadgeProps } from './contact-group-badge';
export { ContactGroupManager } from './contact-group-manager';
export type { ContactGroupManagerProps } from './contact-group-manager';
export { OrganizationFilter } from './organization-filter';
export type { OrganizationFilterProps } from './organization-filter';
export type {
  Organization,
  ContactGroup,
  ContactRelationship,
  RelationshipType,
  ContactWithOrg,
} from './types';
