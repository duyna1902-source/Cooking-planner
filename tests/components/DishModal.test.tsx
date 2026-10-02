import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DishModal } from '../../src/components/DishModal';

describe('DishModal (Ticket 01)', () => {
  it('prefills dish name with trimmed initialName when adding a new dish', () => {
    render(
      <DishModal
        isOpen={true}
        initialName="  Canh bầu nấu tôm  "
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByTestId('dish-name-input') as HTMLInputElement;
    expect(input.value).toBe('Canh bầu nấu tôm');
  });

  it('leaves dish name empty when initialName is not provided for a new dish', () => {
    render(
      <DishModal
        isOpen={true}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByTestId('dish-name-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('renders with z-[60] to cleanly overlay on drawer (z-50)', () => {
    render(
      <DishModal
        isOpen={true}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('z-[60]');
  });
});
