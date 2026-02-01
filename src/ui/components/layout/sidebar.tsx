import * as React from 'react';
import { Bell, Folder, Calendar, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/ui/lib/utils';
import { Button } from '@/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/components/ui/tooltip';
import { Separator } from '@/ui/components/ui/separator';
import { ScrollArea } from '@/ui/components/ui/scroll-area';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

const defaultNavItems: NavItem[] = [
  { id: 'activity', label: 'Activity', icon: Bell },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'people', label: 'People', icon: Users },
  { id: 'search', label: 'Search', icon: Search },
];

export interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (item: NavItem) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function Sidebar({
  items = defaultNavItems,
  activeItem = 'activity',
  onItemClick,
  collapsed = false,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const handleToggleCollapse = () => {
    onCollapsedChange?.(!collapsed);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-testid="sidebar"
        data-collapsed={collapsed}
        className={cn(
          'flex h-full flex-col border-r border-border bg-surface transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Logo / Header */}
        <div className="flex h-14 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground">clawdbot</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(collapsed && 'mx-auto')}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* Navigation Items */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2" role="navigation" aria-label="Main navigation">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              const button = (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'justify-start gap-3',
                    collapsed && 'justify-center px-0',
                    isActive && 'bg-accent/10 text-accent'
                  )}
                  onClick={() => {
                    item.onClick?.();
                    onItemClick?.(item);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-muted-foreground',
                  collapsed && 'justify-center px-0'
                )}
                onClick={() => onItemClick?.({ id: 'search', label: 'Search', icon: Search })}
              >
                <Search className="size-5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left">
                    Search...
                    <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      ⌘K
                    </kbd>
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Search (⌘K)
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
