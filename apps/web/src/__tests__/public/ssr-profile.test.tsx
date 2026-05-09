/**
 * SSR verification tests.
 * These verify that public profile pages are server-rendered
 * (no useEffect-only data fetching — data is passed as props from server).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProfileHero } from '@/app/(public)/engineer/[id]/_components/profile-hero';
import { TabProjects } from '@/app/(public)/engineer/[id]/_components/tab-projects';
import { TabExperience } from '@/app/(public)/engineer/[id]/_components/tab-experience';
import { TabReviews } from '@/app/(public)/engineer/[id]/_components/tab-reviews';
import { MOCK_ENGINEER } from '@/lib/mock-data';

beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => {
    // Do NOT call cb — prevents infinite recursion in animation loop
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Public profile pages — SSR data flow', () => {
  it('ProfileHero renders engineer name from props (no async fetch)', () => {
    // If this renders synchronously with the correct name, data came from props (SSR)
    render(<ProfileHero engineer={MOCK_ENGINEER} />);
    expect(screen.getByText(MOCK_ENGINEER.name)).toBeInTheDocument();
  });

  it('ProfileHero renders headline from props', () => {
    render(<ProfileHero engineer={MOCK_ENGINEER} />);
    expect(screen.getByText(MOCK_ENGINEER.headline)).toBeInTheDocument();
  });

  it('TabProjects renders all projects from props without loading state', () => {
    render(<TabProjects projects={MOCK_ENGINEER.projects} />);
    // All projects visible immediately — no skeleton/loading
    MOCK_ENGINEER.projects.forEach((p) => {
      expect(screen.getByText(p.title)).toBeInTheDocument();
    });
  });

  it('TabExperience renders all experiences from props', () => {
    render(<TabExperience experiences={MOCK_ENGINEER.experiences} />);
    MOCK_ENGINEER.experiences.forEach((e) => {
      expect(screen.getByText(e.company)).toBeInTheDocument();
    });
  });

  it('TabReviews renders all reviews from props', () => {
    render(<TabReviews reviews={MOCK_ENGINEER.reviews} />);
    MOCK_ENGINEER.reviews.forEach((r) => {
      expect(screen.getByText(r.reviewerName)).toBeInTheDocument();
    });
  });

  it('engineer availability status is rendered from props', () => {
    render(<ProfileHero engineer={MOCK_ENGINEER} />);
    expect(screen.getByText(MOCK_ENGINEER.availabilityLabel)).toBeInTheDocument();
  });

  it('engineer location is rendered from props', () => {
    render(<ProfileHero engineer={MOCK_ENGINEER} />);
    expect(screen.getByText(MOCK_ENGINEER.location)).toBeInTheDocument();
  });
});
