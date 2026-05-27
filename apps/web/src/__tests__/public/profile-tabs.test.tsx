import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileTabs } from '@/app/(public)/engineer/[id]/_components/profile-tabs';

const mockRect = (left: number, width: number) => ({
  left, width, top: 0, right: left + width, bottom: 0, height: 0, x: left, y: 0,
  toJSON: () => {},
});

describe('ProfileTabs — sliding underline', () => {
  beforeEach(() => {
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const testId = (this as HTMLElement).textContent;
      const positions: Record<string, { left: number; width: number }> = {
        'Projects': { left: 0, width: 80 },
        'Experience': { left: 80, width: 90 },
        'Tech Stack': { left: 170, width: 90 },
        'Reviews': { left: 260, width: 75 },
        'Marketplace': { left: 335, width: 100 },
        'Activity': { left: 435, width: 75 },
      };
      const pos = positions[testId ?? ''] ?? { left: 0, width: 80 };
      return mockRect(pos.left, pos.width) as DOMRect;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all 6 section nav buttons', () => {
    render(<ProfileTabs activeTab="projects" onTabChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tech Stack' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marketplace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activity' })).toBeInTheDocument();
  });

  it('marks active section with aria-current=page', () => {
    render(<ProfileTabs activeTab="experience" onTabChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Experience' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Projects' })).not.toHaveAttribute('aria-current');
  });

  it('calls onTabChange with correct tab id when clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    render(<ProfileTabs activeTab="projects" onTabChange={onTabChange} />);

    await user.click(screen.getByRole('button', { name: 'Reviews' }));
    expect(onTabChange).toHaveBeenCalledWith('reviews');
  });

  it('calls onTabChange for each tab', async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    render(<ProfileTabs activeTab="projects" onTabChange={onTabChange} />);

    const tabs = [
      { name: 'Experience', id: 'experience' },
      { name: 'Tech Stack', id: 'tech-stack' },
      { name: 'Marketplace', id: 'marketplace' },
      { name: 'Activity', id: 'activity' },
    ];

    for (const tab of tabs) {
      await user.click(screen.getByRole('button', { name: tab.name }));
      expect(onTabChange).toHaveBeenCalledWith(tab.id);
    }
  });

  it('underline element exists in DOM', () => {
    render(<ProfileTabs activeTab="projects" onTabChange={jest.fn()} />);
    expect(screen.getByTestId('tab-underline')).toBeInTheDocument();
  });
});
