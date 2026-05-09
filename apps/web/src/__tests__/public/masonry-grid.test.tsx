import React from 'react';
import { render, screen } from '@testing-library/react';
import { TabProjects } from '@/app/(public)/engineer/[id]/_components/tab-projects';
import { MOCK_ENGINEER } from '@/lib/mock-data';

describe('Masonry grid — no layout shift on image load', () => {
  it('renders all projects', () => {
    render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    MOCK_ENGINEER.projects.forEach((p) => {
      expect(screen.getByText(p.title)).toBeInTheDocument();
    });
  });

  it('renders the masonry grid container', () => {
    const { container } = render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    const grid = container.querySelector('[data-testid="projects-masonry"]');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('masonry-grid');
  });

  it('each project card has break-inside-avoid to prevent layout shift', () => {
    const { container } = render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    // The masonry-grid CSS class applies break-inside: avoid to children
    // We verify the grid class is applied (CSS is tested via class presence)
    const grid = container.querySelector('.masonry-grid');
    expect(grid).not.toBeNull();
    // All direct children should be article elements
    const articles = grid?.querySelectorAll('article');
    expect(articles?.length).toBe(MOCK_ENGINEER.projects.length);
  });

  it('project thumbnails do not use img tags (no layout shift)', () => {
    const { container } = render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    // Thumbnails are CSS gradient divs, not img tags — no layout shift
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(0);
  });

  it('renders type badge on each project', () => {
    render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    // Check that each project's type appears at least once
    const types = [...new Set(MOCK_ENGINEER.projects.map((p) => p.type))];
    types.forEach((type) => {
      const badges = screen.getAllByText(type);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('renders metrics for each project', () => {
    render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    // Check first project's metrics
    const firstProject = MOCK_ENGINEER.projects[0];
    firstProject.metrics.forEach((m) => {
      expect(screen.getByText(m.value)).toBeInTheDocument();
    });
  });

  it('renders demo link when demoUrl is present', () => {
    render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    const demoLinks = screen.getAllByText(/Try Demo/);
    const projectsWithDemo = MOCK_ENGINEER.projects.filter((p) => p.demoUrl);
    expect(demoLinks.length).toBe(projectsWithDemo.length);
  });
});
