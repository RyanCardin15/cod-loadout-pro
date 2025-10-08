/**
 * LoadoutCard Component Tests
 *
 * Tests the LoadoutCard component for:
 * - Proper rendering of loadout data
 * - Action buttons (edit, delete, share)
 * - Rating and favorites display
 * - Attachments rendering
 * - Responsive behavior
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadoutCard } from '@/components/shared/LoadoutCard';
import { renderWithProviders } from '../setup/testUtils';
import { createMockLoadout } from '../setup/mocks';

describe('LoadoutCard', () => {
  const mockLoadout = createMockLoadout({
    name: 'Test Loadout',
    game: 'MW3',
    primary: {
      weaponId: 'weapon-1',
      weapon: {
        id: 'weapon-1',
        name: 'M4A1',
        category: 'Assault Rifle',
        game: 'MW3',
        meta: {
          tier: 'S',
          popularity: 50,
          winRate: 55,
        },
      },
      attachments: [
        { id: 'att-1', name: 'Red Dot', type: 'optic', slot: 'optic' },
        { id: 'att-2', name: 'Foregrip', type: 'underbarrel', slot: 'underbarrel' },
        { id: 'att-3', name: 'Extended Mag', type: 'magazine', slot: 'magazine' },
      ],
    },
    effectiveRange: 'Medium',
    difficulty: 'Easy',
    overallRating: 8.5,
    favorites: 42,
  });

  describe('Rendering', () => {
    it('renders loadout name', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('Test Loadout')).toBeInTheDocument();
    });

    it('renders game name', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('MW3')).toBeInTheDocument();
    });

    it('renders primary weapon name', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('M4A1')).toBeInTheDocument();
    });

    it('renders weapon category', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('(Assault Rifle)')).toBeInTheDocument();
    });

    it('renders tier badge', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('renders attachments (up to 5)', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('Red Dot')).toBeInTheDocument();
      expect(screen.getByText('Foregrip')).toBeInTheDocument();
      expect(screen.getByText('Extended Mag')).toBeInTheDocument();
    });

    it('renders effective range', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('Effective Range')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('renders difficulty', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('renders overall rating when provided', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('renders favorites count when provided', () => {
      renderWithProviders(<LoadoutCard loadout={mockLoadout} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('does not render rating when not provided', () => {
      const loadoutWithoutRating = createMockLoadout({
        overallRating: undefined,
      });

      renderWithProviders(<LoadoutCard loadout={loadoutWithoutRating} />);

      // Rating should not be in document
      const ratings = screen.queryAllByText(/^\d+\.\d+$/);
      expect(ratings).toHaveLength(0);
    });
  });

  describe('Action Buttons', () => {
    it('renders action buttons when showActions is true', () => {
      renderWithProviders(
        <LoadoutCard
          loadout={mockLoadout}
          showActions={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onShare={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('does not render action buttons when showActions is false', () => {
      renderWithProviders(
        <LoadoutCard loadout={mockLoadout} showActions={false} />
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const handleEdit = jest.fn();

      renderWithProviders(
        <LoadoutCard
          loadout={mockLoadout}
          onEdit={handleEdit}
          showActions={true}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();

      renderWithProviders(
        <LoadoutCard
          loadout={mockLoadout}
          onDelete={handleDelete}
          showActions={true}
        />
      );

      const deleteButton = screen.getByTitle('Delete');
      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onShare when share button is clicked', async () => {
      const user = userEvent.setup();
      const handleShare = jest.fn();

      renderWithProviders(
        <LoadoutCard
          loadout={mockLoadout}
          onShare={handleShare}
          showActions={true}
        />
      );

      const shareButton = screen.getByTitle('Share');
      await user.click(shareButton);

      expect(handleShare).toHaveBeenCalledTimes(1);
    });

    it('does not render edit button when onEdit is not provided', () => {
      renderWithProviders(
        <LoadoutCard loadout={mockLoadout} showActions={true} />
      );

      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles loadout with no attachments', () => {
      const loadoutNoAttachments = createMockLoadout({
        primary: {
          ...mockLoadout.primary,
          attachments: [],
        },
      });

      renderWithProviders(<LoadoutCard loadout={loadoutNoAttachments} />);

      expect(screen.getByText('M4A1')).toBeInTheDocument();
    });

    it('only displays first 5 attachments when more than 5 exist', () => {
      const loadoutManyAttachments = createMockLoadout({
        primary: {
          ...mockLoadout.primary,
          attachments: [
            { id: '1', name: 'Att 1', type: 'optic', slot: 'optic' },
            { id: '2', name: 'Att 2', type: 'barrel', slot: 'barrel' },
            { id: '3', name: 'Att 3', type: 'magazine', slot: 'magazine' },
            { id: '4', name: 'Att 4', type: 'underbarrel', slot: 'underbarrel' },
            { id: '5', name: 'Att 5', type: 'stock', slot: 'stock' },
            { id: '6', name: 'Att 6', type: 'muzzle', slot: 'muzzle' },
            { id: '7', name: 'Att 7', type: 'laser', slot: 'laser' },
          ],
        },
      });

      renderWithProviders(<LoadoutCard loadout={loadoutManyAttachments} />);

      expect(screen.getByText('Att 1')).toBeInTheDocument();
      expect(screen.getByText('Att 5')).toBeInTheDocument();
      expect(screen.queryByText('Att 6')).not.toBeInTheDocument();
      expect(screen.queryByText('Att 7')).not.toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = renderWithProviders(
        <LoadoutCard loadout={mockLoadout} className="custom-loadout-class" />
      );

      const card = container.querySelector('.custom-loadout-class');
      expect(card).toBeInTheDocument();
    });

    it('handles very long loadout names', () => {
      const loadoutLongName = createMockLoadout({
        name: 'This Is An Extremely Long Loadout Name That Should Still Display Properly',
      });

      renderWithProviders(<LoadoutCard loadout={loadoutLongName} />);

      expect(
        screen.getByText('This Is An Extremely Long Loadout Name That Should Still Display Properly')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      renderWithProviders(
        <LoadoutCard
          loadout={mockLoadout}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onShare={jest.fn()}
          showActions={true}
        />
      );

      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
      expect(screen.getByTitle('Share')).toBeInTheDocument();
    });
  });
});
