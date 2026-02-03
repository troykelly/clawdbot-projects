/**
 * Types for work item move/reparent components
 */

import type { TreeItemKind } from '@/ui/components/tree/types';

export interface MoveItem {
  id: string;
  title: string;
  kind: TreeItemKind;
  currentParentId?: string | null;
  currentParentTitle?: string;
}

export interface PotentialParent {
  id: string;
  title: string;
  kind: TreeItemKind;
}

export interface MoveToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single item to move */
  item?: MoveItem;
  /** Multiple items for bulk move */
  items?: MoveItem[];
  /** List of potential parent items */
  potentialParents: PotentialParent[];
  onMove: (newParentId: string | null) => void;
  isMoving: boolean;
}

export interface UseWorkItemMoveOptions {
  onMoved?: () => void;
  onError?: (error: Error) => void;
}

export interface UseWorkItemMoveReturn {
  moveItem: (item: { id: string; title: string }, newParentId: string | null) => Promise<void>;
  moveItems: (items: { id: string; title: string }[], newParentId: string | null) => Promise<void>;
  isMoving: boolean;
}
