/**
 * Test: Comparison table aligns correctly with 4 products selected.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonBar } from '@/app/(public)/marketplace/_components/comparison-bar';
import { ProductCard } from '@/app/(public)/marketplace/_components/product-card';
import { MOCK_PRODUCTS } from '@/lib/marketplace-data';

describe('ComparisonBar', () => {
  it('does not render when fewer than 2 products selected', () => {
    render(
      <ComparisonBar
        selected={[MOCK_PRODUCTS[0]]}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    expect(screen.queryByTestId('comparison-bar')).not.toBeInTheDocument();
  });

  it('renders when 2 products are selected', () => {
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 2)}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    expect(screen.getByTestId('comparison-bar')).toBeInTheDocument();
    expect(screen.getByText('Comparing 2 products')).toBeInTheDocument();
  });

  it('renders with 4 products selected', () => {
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 4)}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    expect(screen.getByText('Comparing 4 products')).toBeInTheDocument();
  });

  it('shows all selected product names', () => {
    const selected = MOCK_PRODUCTS.slice(0, 3);
    render(
      <ComparisonBar selected={selected} onRemove={jest.fn()} onClear={jest.fn()} />
    );
    selected.forEach((p) => {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    });
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 2)}
        onRemove={onRemove}
        onClear={jest.fn()}
      />
    );
    // Multiple remove buttons exist (one per product) — click the first
    const removeBtns = screen.getAllByRole('button', { name: /remove.*from comparison/i });
    await user.click(removeBtns[0]);
    expect(onRemove).toHaveBeenCalledWith(MOCK_PRODUCTS[0].id);
  });

  it('calls onClear when Clear all is clicked', async () => {
    const onClear = jest.fn();
    const user = userEvent.setup();
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 2)}
        onRemove={jest.fn()}
        onClear={onClear}
      />
    );
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('opens comparison modal when View Comparison is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 2)}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('view-comparison-btn'));
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  it('comparison table has correct number of columns for 4 products', async () => {
    const user = userEvent.setup();
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 4)}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('view-comparison-btn'));

    const table = screen.getByTestId('comparison-table').querySelector('table');
    expect(table).toBeInTheDocument();

    // Header row: 1 label column + 4 product columns = 5 th elements
    const headers = table!.querySelectorAll('thead th');
    expect(headers).toHaveLength(5);
  });

  it('comparison table shows product names in headers', async () => {
    const user = userEvent.setup();
    const selected = MOCK_PRODUCTS.slice(0, 2);
    render(
      <ComparisonBar selected={selected} onRemove={jest.fn()} onClear={jest.fn()} />
    );
    await user.click(screen.getByTestId('view-comparison-btn'));

    selected.forEach((p) => {
      expect(screen.getAllByText(p.name).length).toBeGreaterThan(0);
    });
  });

  it('comparison table shows price row', async () => {
    const user = userEvent.setup();
    render(
      <ComparisonBar
        selected={MOCK_PRODUCTS.slice(0, 2)}
        onRemove={jest.fn()}
        onClear={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('view-comparison-btn'));
    expect(screen.getByText('Price')).toBeInTheDocument();
  });
});

describe('ProductCard — compare checkbox', () => {
  it('renders compare checkbox', () => {
    render(
      <ProductCard
        product={MOCK_PRODUCTS[0]}
        onCompareToggle={jest.fn()}
        isComparing={false}
      />
    );
    expect(screen.getByTestId(`compare-checkbox-${MOCK_PRODUCTS[0].id}`)).toBeInTheDocument();
  });

  it('checkbox is checked when isComparing=true', () => {
    render(
      <ProductCard
        product={MOCK_PRODUCTS[0]}
        onCompareToggle={jest.fn()}
        isComparing={true}
      />
    );
    const checkbox = screen.getByTestId(`compare-checkbox-${MOCK_PRODUCTS[0].id}`);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onCompareToggle when checkbox is clicked', () => {
    const onCompareToggle = jest.fn();
    render(
      <ProductCard
        product={MOCK_PRODUCTS[0]}
        onCompareToggle={onCompareToggle}
        isComparing={false}
      />
    );
    fireEvent.click(screen.getByTestId(`compare-checkbox-${MOCK_PRODUCTS[0].id}`));
    expect(onCompareToggle).toHaveBeenCalledWith(MOCK_PRODUCTS[0].id);
  });

  it('checkbox is disabled when compareDisabled=true and not comparing', () => {
    render(
      <ProductCard
        product={MOCK_PRODUCTS[0]}
        onCompareToggle={jest.fn()}
        isComparing={false}
        compareDisabled={true}
      />
    );
    const checkbox = screen.getByTestId(`compare-checkbox-${MOCK_PRODUCTS[0].id}`);
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });
});
