import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuView } from '../../src/components/MenuView';
import { InMemoryDishRepository } from '../../src/services/dishRepository';

describe('Menu / Dish Management Integration', () => {
  let dishRepo: InMemoryDishRepository;
  const householdCode = 'BEP-892';

  beforeEach(() => {
    dishRepo = new InMemoryDishRepository();
  });

  it('displays empty state initially with prompt to add dishes', async () => {
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    await waitFor(() => {
      expect(screen.getByText('Menu gia đình đang trống')).toBeInTheDocument();
    });
    expect(screen.getByTestId('add-dish-menu-btn')).toBeInTheDocument();
    expect(screen.getByTestId('add-first-dish-btn')).toBeInTheDocument();
  });

  it('allows user to add a new Món ăn with name and tag', async () => {
    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    const addBtn = screen.getByTestId('add-dish-menu-btn');
    await user.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Thêm Món ăn mới')).toBeInTheDocument();

    const nameInput = screen.getByTestId('dish-name-input');
    const tagInput = screen.getByTestId('dish-tag-input');
    const saveBtn = screen.getByTestId('save-dish-btn');

    await user.type(nameInput, 'Thịt ba chỉ kho trứng');
    await user.type(tagInput, 'Món mặn');
    await user.click(saveBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Dish appears in the list
    expect(screen.getByText('Thịt ba chỉ kho trứng')).toBeInTheDocument();
    expect(screen.getByText('Món mặn')).toBeInTheDocument();

    // Persisted in repository
    const storedDishes = await dishRepo.getDishes(householdCode);
    expect(storedDishes).toHaveLength(1);
    expect(storedDishes[0].name).toBe('Thịt ba chỉ kho trứng');
    expect(storedDishes[0].tag).toBe('Món mặn');
  });

  it('allows user to add a Món ăn with name only (tag is optional)', async () => {
    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    const addFirstBtn = await screen.findByTestId('add-first-dish-btn');
    await user.click(addFirstBtn);
    await user.type(screen.getByTestId('dish-name-input'), 'Rau muống luộc');
    await user.click(screen.getByTestId('save-dish-btn'));

    await waitFor(() => {
      expect(screen.getByText('Rau muống luộc')).toBeInTheDocument();
    });

    const storedDishes = await dishRepo.getDishes(householdCode);
    expect(storedDishes[0].tag).toBeUndefined();
  });

  it('shows validation error when dish name is empty', async () => {
    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    const addBtn = await screen.findByTestId('add-dish-menu-btn');
    await user.click(addBtn);
    await user.click(screen.getByTestId('save-dish-btn'));

    expect(screen.getByTestId('dish-form-error')).toHaveTextContent('Vui lòng nhập tên Món ăn');
  });

  it('filters dishes in real-time by name and tag', async () => {
    await dishRepo.addDish(householdCode, { name: 'Sườn xào chua ngọt', tag: 'Món mặn' });
    await dishRepo.addDish(householdCode, { name: 'Canh chua cá lóc', tag: 'Canh' });
    await dishRepo.addDish(householdCode, { name: 'Canh cua mồng tơi', tag: 'Canh' });

    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    await waitFor(() => {
      expect(screen.getByText('Sườn xào chua ngọt')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('dish-search-input');

    // Filter by name (including unaccented Vietnamese search)
    await user.type(searchInput, 'suon');
    expect(screen.getByText('Sườn xào chua ngọt')).toBeInTheDocument();
    expect(screen.queryByText('Canh chua cá lóc')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);
    expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();

    // Filter by tag (unaccented)
    await user.type(searchInput, 'mon man');
    expect(screen.getByText('Sườn xào chua ngọt')).toBeInTheDocument();
    expect(screen.queryByText('Canh chua cá lóc')).not.toBeInTheDocument();

    // Filter with no match
    await user.clear(searchInput);
    await user.type(searchInput, 'Khong ton tai');
    expect(screen.getByText(/Không tìm thấy Món ăn nào phù hợp/)).toBeInTheDocument();
  });

  it('allows user to edit an existing Món ăn', async () => {
    const created = await dishRepo.addDish(householdCode, { name: 'Thịt kho', tag: 'Món mặn' });

    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    await waitFor(() => {
      expect(screen.getByText('Thịt kho')).toBeInTheDocument();
    });

    // Click edit button
    const editBtn = screen.getByTestId(`edit-dish-${created.id}`);
    await user.click(editBtn);

    expect(screen.getByText('Chỉnh sửa Món ăn')).toBeInTheDocument();
    const nameInput = screen.getByTestId('dish-name-input');
    const tagInput = screen.getByTestId('dish-tag-input');

    expect(nameInput).toHaveValue('Thịt kho');
    expect(tagInput).toHaveValue('Món mặn');

    await user.clear(nameInput);
    await user.type(nameInput, 'Thịt kho trứng vịt');
    await user.clear(tagInput);
    await user.type(tagInput, 'Món chính');
    await user.click(screen.getByTestId('save-dish-btn'));

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng vịt')).toBeInTheDocument();
    });
    expect(screen.getByText('Món chính')).toBeInTheDocument();
    expect(screen.queryByText('Thịt kho')).not.toBeInTheDocument();

    const stored = await dishRepo.getDishes(householdCode);
    expect(stored[0].name).toBe('Thịt kho trứng vịt');
    expect(stored[0].tag).toBe('Món chính');
  });

  it('allows user to safely delete a Món ăn with confirmation', async () => {
    const dish = await dishRepo.addDish(householdCode, { name: 'Cá kho tộ' });

    const user = userEvent.setup();
    render(<MenuView householdCode={householdCode} dishRepository={dishRepo} />);

    await waitFor(() => {
      expect(screen.getByText('Cá kho tộ')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId(`delete-dish-${dish.id}`);
    await user.click(deleteBtn);

    // Confirmation dialog appears
    expect(screen.getByText('Xóa Món ăn')).toBeInTheDocument();
    expect(screen.getByText(/Bạn có chắc chắn muốn xóa/)).toBeInTheDocument();

    // Cancel first
    await user.click(screen.getByText('Hủy'));
    expect(screen.getByText('Cá kho tộ')).toBeInTheDocument();

    // Click delete again and confirm
    await user.click(deleteBtn);
    const confirmBtn = screen.getByTestId('confirm-delete-dish-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('Cá kho tộ')).not.toBeInTheDocument();
    });

    const stored = await dishRepo.getDishes(householdCode);
    expect(stored).toHaveLength(0);
    expect(screen.getByText('Menu gia đình đang trống')).toBeInTheDocument();
  });
});
