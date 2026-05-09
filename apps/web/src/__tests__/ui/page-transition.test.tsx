import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageTransition } from '@/components/ui/page-transition';

describe('PageTransition', () => {
  it('renders children', () => {
    render(
      <PageTransition>
        <div data-testid="child">Hello</div>
      </PageTransition>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies animate-page-in class', () => {
    const { container } = render(
      <PageTransition>
        <span>content</span>
      </PageTransition>
    );
    expect(container.firstChild).toHaveClass('animate-page-in');
  });

  it('does not cause layout shift — wrapper has no margin or padding by default', () => {
    const { container } = render(
      <PageTransition>
        <span>content</span>
      </PageTransition>
    );
    const wrapper = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(wrapper);
    // Should not add margin/padding that shifts layout
    expect(style.margin).toBe('');
    expect(style.padding).toBe('');
  });

  it('accepts and applies custom className', () => {
    const { container } = render(
      <PageTransition className="custom-class">
        <span>content</span>
      </PageTransition>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
