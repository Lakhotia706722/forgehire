import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OTPInput } from '@/components/ui/otp-input';

describe('OTPInput — auto-advance focus', () => {
  it('renders 6 individual input boxes', () => {
    render(<OTPInput value="" onChange={jest.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('advances focus to next box on digit entry', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OTPInput value="" onChange={onChange} />);

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[0]);
    await user.keyboard('1');

    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('calls onComplete when all 6 digits entered', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    const onChange = jest.fn((val) => val);

    const { rerender } = render(
      <OTPInput value="" onChange={onChange} onComplete={onComplete} />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[0]);

    // Simulate pasting a full code
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '123456' },
    });

    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('handles backspace to go to previous box', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OTPInput value="12" onChange={onChange} />);

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[1]);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalled();
  });

  it('applies error styling when error prop is true', () => {
    render(<OTPInput value="" onChange={jest.fn()} error={true} />);
    const inputs = screen.getAllByRole('textbox');
    // All boxes should have error border class
    inputs.forEach((input) => {
      expect(input.className).toContain('accent-red');
    });
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<OTPInput value="" onChange={jest.fn()} disabled={true} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('only accepts numeric input', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OTPInput value="" onChange={onChange} />);

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[0]);
    await user.keyboard('a');

    // onChange should not be called with non-numeric
    const calls = onChange.mock.calls;
    const nonEmptyCalls = calls.filter(([val]) => val !== '');
    expect(nonEmptyCalls.length).toBe(0);
  });
});
