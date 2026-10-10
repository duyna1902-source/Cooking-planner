import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareHouseholdModal } from '../../src/components/ShareHouseholdModal';

describe('ShareHouseholdModal (Ticket 03 copy)', () => {
  it('displays instructions with "chọn Thành viên" instead of legacy "biệt danh"', () => {
    render(
      <ShareHouseholdModal
        householdCode="BEP-123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('Người thân chỉ cần mở link này trên điện thoại và chọn Thành viên để vào cùng Nhà.')
    ).toBeInTheDocument();
  });
});
