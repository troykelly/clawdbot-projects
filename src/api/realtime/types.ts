/**
 * Real-time event types and interfaces.
 * Part of Issue #213.
 */

/**
 * Available real-time event types
 */
export type RealtimeEventType =
  | 'work_item:created'
  | 'work_item:updated'
  | 'work_item:deleted'
  | 'memory:created'
  | 'memory:updated'
  | 'memory:deleted'
  | 'contact:created'
  | 'contact:updated'
  | 'contact:deleted'
  | 'message:received'
  | 'notification:created'
  | 'connection:established'
  | 'connection:ping'
  | 'connection:pong';

/**
 * Real-time event message structure
 */
export interface RealtimeEvent<T = unknown> {
  event: RealtimeEventType;
  data: T;
  timestamp: string;
}

/**
 * Work item event data
 */
export interface WorkItemEventData {
  id: string;
  changes?: string[];
  title?: string;
  action?: string;
}

/**
 * Memory event data
 */
export interface MemoryEventData {
  id: string;
  changes?: string[];
  title?: string;
  memoryType?: string;
}

/**
 * Contact event data
 */
export interface ContactEventData {
  id: string;
  changes?: string[];
  displayName?: string;
}

/**
 * Message received event data
 */
export interface MessageEventData {
  id: string;
  threadId?: string;
  source: string;
  preview?: string;
}

/**
 * Notification event data
 */
export interface NotificationEventData {
  id: string;
  type: string;
  title?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Connection event data
 */
export interface ConnectionEventData {
  clientId: string;
  connectedAt?: string;
}

/**
 * Internal event for PostgreSQL NOTIFY
 */
export interface NotifyPayload {
  event: RealtimeEventType;
  userId?: string;
  data: unknown;
}

/**
 * WebSocket client info
 */
export interface WebSocketClient {
  clientId: string;
  userId?: string;
  socket: unknown;
  connectedAt: Date;
  lastPing: Date;
}
