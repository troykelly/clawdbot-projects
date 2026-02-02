/**
 * Types for audit logging.
 * Part of Issue #214.
 */

export type AuditActorType = 'agent' | 'human' | 'system';
export type AuditActionType = 'create' | 'update' | 'delete' | 'auth' | 'webhook';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorType: AuditActorType;
  actorId: string | null;
  action: AuditActionType;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogQueryOptions {
  entityType?: string;
  entityId?: string;
  actorType?: AuditActorType;
  actorId?: string;
  action?: AuditActionType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogCreateParams {
  actorType: AuditActorType;
  actorId?: string | null;
  action: AuditActionType;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditActor {
  type: AuditActorType;
  id: string | null;
}
