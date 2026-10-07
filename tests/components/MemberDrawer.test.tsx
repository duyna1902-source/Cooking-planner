import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberDrawer } from '../../src/components/MemberDrawer';
import { Member, AVATAR_PRESETS } from '../../src/domain/member';

describe('MemberDrawer', () => {
  const existingMembers: Member[] = [
    {
      id: 'm1',
      householdCode: 'BEP-892',
      name: 'Mẹ Bắp',
      avatarIcon: '🍳',
      avatarColor: 'bg-[#FEF7DC]',
      createdAt: '2026-10-07T10:00:00.000Z',
    },
    {
      id: 'm2',
      householdCode: 'BEP-892',
      name: 'Bố Tuấn',
      avatarIcon: '🍜',
      avatarColor: 'bg-[#E0F2FE]',
      createdAt: '2026-10-07T10:05:00.000Z',
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <MemberDrawer
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        existingMembers={existingMembers}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer with title, name input, and 8 avatar presets when isOpen is true', () => {
    render(
      <MemberDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        existingMembers={existingMembers}
      />
    );

    expect(screen.getByText('Thêm Thành Viên Mới')).toBeInTheDocument();
    const input = screen.getByTestId('member-name-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxLength', '30');

    // 8 presets rendered
    AVATAR_PRESETS.forEach((preset) => {
      expect(screen.getByTestId(`avatar-preset-${preset.icon}`)).toBeInTheDocument();
      expect(screen.getByText(preset.label)).toBeInTheDocument();
    });

    // Default first preset is selected (has ring-2 ring-[#5B7C99])
    const firstPreset = screen.getByTestId(`avatar-preset-${AVATAR_PRESETS[0].icon}`);
    expect(firstPreset.className).toContain('ring-2 ring-[#5B7C99]');
  });

  it('selecting a different preset updates the active selection', async () => {
    const user = userEvent.setup();
    render(
      <MemberDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        existingMembers={existingMembers}
      />
    );

    const noodlePreset = screen.getByTestId('avatar-preset-🍜');
    await user.click(noodlePreset);

    expect(noodlePreset.className).toContain('ring-2 ring-[#5B7C99]');
    const eggPreset = screen.getByTestId('avatar-preset-🍳');
    expect(eggPreset.className).not.toContain('ring-2 ring-[#5B7C99]');
  });

  it('displays friendly error message when trying to submit empty or whitespace name', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(
      <MemberDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        existingMembers={existingMembers}
      />
    );

    const saveBtn = screen.getByTestId('save-member-btn');
    await user.click(saveBtn);

    expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-error')).toHaveTextContent(/Vui lòng nhập tên thành viên/i);
    expect(handleSave).not.toHaveBeenCalled();

    // Type only whitespace
    const input = screen.getByTestId('member-name-input');
    await user.type(input, '    ');
    await user.click(saveBtn);

    expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('displays error message when trying to submit a duplicate member name (case-insensitive, trimmed)', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(
      <MemberDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        existingMembers={existingMembers}
      />
    );

    const input = screen.getByTestId('member-name-input');
    await user.type(input, '   mẹ bắp   ');

    const saveBtn = screen.getByTestId('save-member-btn');
    await user.click(saveBtn);

    expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-error')).toHaveTextContent(/đã tồn tại|đã có trong gia đình/i);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed name and selected avatar preset when valid', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(
      <MemberDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        existingMembers={existingMembers}
      />
    );

    const input = screen.getByTestId('member-name-input');
    await user.type(input, '  Bé An  ');

    // Select avocado preset 🥑
    const avocadoPreset = screen.getByTestId('avatar-preset-🥑');
    await user.click(avocadoPreset);

    const saveBtn = screen.getByTestId('save-member-btn');
    await user.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith({
      name: 'Bé An',
      avatarIcon: '🥑',
      avatarColor: 'bg-[#ECFCCB]',
    });
  });

  it('calls onClose when clicking close button or cancel button', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <MemberDrawer
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
        existingMembers={existingMembers}
      />
    );

    const closeBtn = screen.getByTestId('close-drawer-btn');
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByTestId('cancel-drawer-btn');
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
