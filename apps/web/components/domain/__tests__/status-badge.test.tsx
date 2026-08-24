import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge, statusLabel } from '@/components/domain/status-badge';

describe('StatusBadge', () => {
  it('gives every shipment state a human label', () => {
    expect(statusLabel('pending_payment')).toBe('To’lov kutilmoqda');
    expect(statusLabel('partially_shipped')).toBe('Qisman jo’natildi');
    expect(statusLabel('return_requested')).toBe('Qaytarish so’raldi');
  });

  it('falls back to the raw value for an unknown state rather than rendering nothing', () => {
    render(<StatusBadge status="some_new_state" />);
    expect(screen.getByText('some new state')).toBeInTheDocument();
  });
});
