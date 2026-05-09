/**
 * Test: NDA modal signature canvas works on touch devices.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NDAModal } from '@/app/engineer/bounties/[id]/_components/nda-modal';

// Mock canvas getContext globally — jsdom doesn't implement it
const mockCtx = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  strokeStyle: '',
  lineWidth: 0,
  lineCap: '',
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx) as any;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper: click the custom checkbox div
function clickCheckbox() {
  // The checkbox is a div with role="checkbox" — use getAllByRole and take first
  const checkboxes = screen.getAllByRole('checkbox');
  fireEvent.click(checkboxes[0]);
}

// Helper: click the Draw mode button
function clickDrawMode() {
  const drawBtn = screen.getByRole('button', { name: 'Draw' });
  fireEvent.click(drawBtn);
}

describe('NDAModal — signature canvas (touch device support)', () => {
  it('renders the modal when open', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test Bounty" />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Non-Disclosure Agreement')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <NDAModal open={false} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test Bounty" />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows NDA document text with task title', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="My Task" />
    );
    // The heading "NON-DISCLOSURE AGREEMENT" appears as a paragraph with exact text
    expect(screen.getByText('NON-DISCLOSURE AGREEMENT')).toBeInTheDocument();
    expect(screen.getByText(/My Task/)).toBeInTheDocument();
  });

  it('Sign button is disabled until checkbox is checked and signature entered', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    expect(screen.getByTestId('nda-sign-btn')).toBeDisabled();
  });

  it('Sign button enables after checking agreement and typing signature', async () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );

    // Check the agreement
    clickCheckbox();

    // Type a signature
    const sigInput = screen.getByTestId('nda-signature-input');
    fireEvent.change(sigInput, { target: { value: 'Arjun Sharma' } });

    expect(screen.getByTestId('nda-sign-btn')).not.toBeDisabled();
  });

  it('switches to draw mode when Draw button is clicked', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );

    clickDrawMode();
    expect(screen.getByTestId('nda-signature-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('nda-signature-input')).not.toBeInTheDocument();
  });

  it('canvas has touch event handlers — touchStart does not throw', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    clickDrawMode();

    const canvas = screen.getByTestId('nda-signature-canvas');

    expect(() => {
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 100, clientY: 50 }],
      });
    }).not.toThrow();
  });

  it('canvas touchMove does not throw', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    clickDrawMode();

    const canvas = screen.getByTestId('nda-signature-canvas');

    // Start drawing first
    fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 25 }] });

    expect(() => {
      fireEvent.touchMove(canvas, { touches: [{ clientX: 100, clientY: 50 }] });
    }).not.toThrow();
  });

  it('canvas touchEnd does not throw', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    clickDrawMode();

    const canvas = screen.getByTestId('nda-signature-canvas');
    fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 25 }] });

    expect(() => {
      fireEvent.touchEnd(canvas);
    }).not.toThrow();
  });

  it('canvas getContext is called during touch drawing', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    clickDrawMode();

    const canvas = screen.getByTestId('nda-signature-canvas');

    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 480, height: 100,
      right: 480, bottom: 100, x: 0, y: 0, toJSON: () => {},
    });

    fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 25 }] });
    fireEvent.touchMove(canvas, { touches: [{ clientX: 100, clientY: 50 }] });

    // getContext should have been called
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('canvas ctx.stroke is called when drawing', () => {
    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );
    clickDrawMode();

    const canvas = screen.getByTestId('nda-signature-canvas');
    canvas.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0, top: 0, width: 480, height: 100,
      right: 480, bottom: 100, x: 0, y: 0, toJSON: () => {},
    });

    fireEvent.touchStart(canvas, { touches: [{ clientX: 50, clientY: 25 }] });
    fireEvent.touchMove(canvas, { touches: [{ clientX: 100, clientY: 50 }] });

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(
      <NDAModal open={true} onClose={onClose} onSigned={jest.fn()} taskTitle="Test" />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSigned after successful typed signature submission', () => {
    const onSigned = jest.fn();
    jest.useFakeTimers();

    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={onSigned} taskTitle="Test" />
    );

    // Check agreement
    clickCheckbox();

    // Type signature
    fireEvent.change(screen.getByTestId('nda-signature-input'), {
      target: { value: 'Arjun Sharma' },
    });

    // Click sign
    fireEvent.click(screen.getByTestId('nda-sign-btn'));

    // Advance past the 1500ms confirmation animation
    act(() => { jest.advanceTimersByTime(2000); });

    expect(onSigned).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('shows confirmation screen after signing', () => {
    jest.useFakeTimers();

    render(
      <NDAModal open={true} onClose={jest.fn()} onSigned={jest.fn()} taskTitle="Test" />
    );

    clickCheckbox();
    fireEvent.change(screen.getByTestId('nda-signature-input'), {
      target: { value: 'Test User' },
    });
    fireEvent.click(screen.getByTestId('nda-sign-btn'));

    // Confirmation screen should appear immediately
    expect(screen.getByText('NDA Signed Successfully')).toBeInTheDocument();

    jest.useRealTimers();
  });
});
