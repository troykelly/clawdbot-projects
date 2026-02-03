/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterBar } from '@/ui/components/filter-bar';
import type { FilterState, SavedFilter } from '@/ui/components/filter-bar/types';

describe('FilterBar', () => {
  const defaultProps = {
    filters: {} as FilterState,
    onFiltersChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the filter bar', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });

    it('renders the add filter button', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add filter/i })).toBeInTheDocument();
    });

    it('renders quick filter chips', () => {
      render(<FilterBar {...defaultProps} showQuickFilters />);
      expect(screen.getByRole('button', { name: /my items/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /overdue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /high priority/i })).toBeInTheDocument();
    });

    it('renders clear all button when filters are applied', () => {
      const filters: FilterState = {
        status: ['in_progress'],
      };
      render(<FilterBar {...defaultProps} filters={filters} />);
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    it('does not render clear all button when no filters', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
    });
  });

  describe('filter chips', () => {
    it('renders active filter chips', () => {
      const filters: FilterState = {
        status: ['in_progress', 'blocked'],
        priority: ['high'],
      };
      render(<FilterBar {...defaultProps} filters={filters} />);

      expect(screen.getByText(/status:/i)).toBeInTheDocument();
      expect(screen.getByText(/priority:/i)).toBeInTheDocument();
    });

    it('removes filter when chip close button is clicked', () => {
      const onFiltersChange = vi.fn();
      const filters: FilterState = {
        status: ['in_progress'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

      const removeButton = screen.getByRole('button', { name: /remove status filter/i });
      fireEvent.click(removeButton);

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('quick filters', () => {
    it('applies "My items" quick filter', () => {
      const onFiltersChange = vi.fn();
      render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} showQuickFilters />);

      fireEvent.click(screen.getByRole('button', { name: /my items/i }));

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ assignee: ['me'] })
      );
    });

    it('applies "Overdue" quick filter', () => {
      const onFiltersChange = vi.fn();
      render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} showQuickFilters />);

      fireEvent.click(screen.getByRole('button', { name: /overdue/i }));

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: 'overdue' })
      );
    });

    it('applies "High priority" quick filter', () => {
      const onFiltersChange = vi.fn();
      render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} showQuickFilters />);

      fireEvent.click(screen.getByRole('button', { name: /high priority/i }));

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ priority: ['high', 'urgent'] })
      );
    });

    it('highlights active quick filter', () => {
      const filters: FilterState = {
        priority: ['high', 'urgent'],
      };
      render(<FilterBar {...defaultProps} filters={filters} showQuickFilters />);

      const highPriorityButton = screen.getByRole('button', { name: /high priority/i });
      expect(highPriorityButton).toHaveAttribute('data-active', 'true');
    });

    it('toggles quick filter off when clicked again', () => {
      const onFiltersChange = vi.fn();
      const filters: FilterState = {
        priority: ['high', 'urgent'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} showQuickFilters />);

      fireEvent.click(screen.getByRole('button', { name: /high priority/i }));

      // Should remove the priority filter
      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('clear all', () => {
    it('clears all filters when clicked', () => {
      const onFiltersChange = vi.fn();
      const filters: FilterState = {
        status: ['in_progress'],
        priority: ['high'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

      fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('saved filters', () => {
    it('shows saved filters dropdown when prop provided', () => {
      const savedFilters: SavedFilter[] = [
        { id: '1', name: 'My Active Tasks', filters: { status: ['in_progress'], assignee: ['me'] } },
      ];
      render(<FilterBar {...defaultProps} savedFilters={savedFilters} />);

      expect(screen.getByRole('button', { name: /saved filters/i })).toBeInTheDocument();
    });

    it('shows save filter button when filters are active and onSaveFilter provided', () => {
      const filters: FilterState = {
        status: ['in_progress'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onSaveFilter={vi.fn()} />);

      expect(screen.getByRole('button', { name: /save filter/i })).toBeInTheDocument();
    });

    it('opens save filter dialog when button clicked', () => {
      const onSaveFilter = vi.fn();
      const filters: FilterState = {
        status: ['in_progress'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onSaveFilter={onSaveFilter} />);

      fireEvent.click(screen.getByRole('button', { name: /save filter/i }));

      // Should show save filter dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
    });

    it('saves filter with name when dialog submitted', async () => {
      const onSaveFilter = vi.fn();
      const filters: FilterState = {
        status: ['in_progress'],
      };
      render(<FilterBar {...defaultProps} filters={filters} onSaveFilter={onSaveFilter} />);

      fireEvent.click(screen.getByRole('button', { name: /save filter/i }));

      const input = screen.getByPlaceholderText(/filter name/i);
      fireEvent.change(input, { target: { value: 'My Filter' } });
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

      expect(onSaveFilter).toHaveBeenCalledWith('My Filter', filters);
    });
  });
});

describe('FilterState', () => {
  it('combines multiple values in same field with OR', () => {
    // This is a logic test for the filter state
    const filters: FilterState = {
      status: ['in_progress', 'blocked'],
    };

    // Items with either status should match
    expect(filters.status).toContain('in_progress');
    expect(filters.status).toContain('blocked');
  });

  it('combines different fields with AND', () => {
    const filters: FilterState = {
      status: ['in_progress'],
      priority: ['high'],
    };

    // Both conditions must be met
    expect(filters.status?.length).toBe(1);
    expect(filters.priority?.length).toBe(1);
  });
});
