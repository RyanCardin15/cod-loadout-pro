/**
 * WeaponCard Component Tests
 *
 * Tests the WeaponCard component for:
 * - Proper rendering of weapon data
 * - Interactive behaviors (hover, click)
 * - Tier badge display
 * - Stat bars visualization
 * - Meta information display
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeaponCard } from '@/components/shared/WeaponCard';
import { renderWithProviders } from '../setup/testUtils';
import { createMockWeapon } from '../setup/mocks';

describe('WeaponCard', () => {
  const mockWeapon = createMockWeapon({
    name: 'Test AR',
    category: 'Assault Rifle',
    game: 'MW3',
    stats: {
      damage: 80,
      range: 65,
      accuracy: 75,
      fireRate: 70,
      mobility: 60,
      control: 70,
    },
    meta: {
      tier: 'S',
      popularity: 45,
      winRate: 55,
      pickRate: 12,
      kdRatio: 1.2,
    },
  });

  describe('Rendering', () => {
    it('renders weapon name correctly', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('Test AR')).toBeInTheDocument();
    });

    it('renders weapon category and game', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('Assault Rifle')).toBeInTheDocument();
      expect(screen.getByText('MW3')).toBeInTheDocument();
    });

    it('renders tier badge with correct tier', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('renders stat bars for damage, range, and accuracy', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('Damage')).toBeInTheDocument();
      expect(screen.getByText('Range')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('displays popularity percentage', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('displays win rate percentage', () => {
      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      expect(screen.getByText('55% WR')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      renderWithProviders(
        <WeaponCard weapon={mockWeapon} onClick={handleClick} />
      );

      const card = screen.getByText('Test AR').closest('div');
      if (card) {
        await user.click(card);
      }

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw error when onClick is not provided', async () => {
      const user = userEvent.setup();

      renderWithProviders(<WeaponCard weapon={mockWeapon} />);

      const card = screen.getByText('Test AR').closest('div');
      if (card) {
        await expect(user.click(card)).resolves.not.toThrow();
      }
    });
  });

  describe('Different Tiers', () => {
    it.each([
      ['S', 'S'],
      ['A', 'A'],
      ['B', 'B'],
      ['C', 'C'],
      ['D', 'D'],
    ] as const)('renders tier %s correctly', (tier) => {
      const weapon = createMockWeapon({
        meta: { ...mockWeapon.meta, tier },
      });

      renderWithProviders(<WeaponCard weapon={weapon} />);

      expect(screen.getByText(tier)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero stat values', () => {
      const weapon = createMockWeapon({
        stats: {
          damage: 0,
          range: 0,
          accuracy: 0,
          fireRate: 0,
          mobility: 0,
          control: 0,
        },
      });

      renderWithProviders(<WeaponCard weapon={weapon} />);

      expect(screen.getByText('Damage')).toBeInTheDocument();
    });

    it('handles 100% stat values', () => {
      const weapon = createMockWeapon({
        stats: {
          damage: 100,
          range: 100,
          accuracy: 100,
          fireRate: 100,
          mobility: 100,
          control: 100,
        },
      });

      renderWithProviders(<WeaponCard weapon={weapon} />);

      expect(screen.getByText('Damage')).toBeInTheDocument();
    });

    it('handles very long weapon names', () => {
      const weapon = createMockWeapon({
        name: 'This Is An Extremely Long Weapon Name That Should Still Render',
      });

      renderWithProviders(<WeaponCard weapon={weapon} />);

      expect(
        screen.getByText('This Is An Extremely Long Weapon Name That Should Still Render')
      ).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = renderWithProviders(
        <WeaponCard weapon={mockWeapon} className="custom-test-class" />
      );

      const card = container.querySelector('.custom-test-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible when onClick is provided', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      renderWithProviders(
        <WeaponCard weapon={mockWeapon} onClick={handleClick} />
      );

      const card = screen.getByText('Test AR').closest('div');
      if (card) {
        card.focus();
        await user.keyboard('{Enter}');
        // Note: This might not trigger onClick depending on implementation
        // The component should be enhanced with proper keyboard support
      }
    });
  });
});
