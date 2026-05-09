/**
 * Test: Screenshot carousel swipe works on mobile touch.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScreenshotCarousel } from '@/app/(public)/marketplace/[id]/_components/screenshot-carousel';

const SLIDES = [
  { type: 'image' as const, url: '/img1.png', alt: 'Screenshot 1' },
  { type: 'image' as const, url: '/img2.png', alt: 'Screenshot 2' },
  { type: 'image' as const, url: '/img3.png', alt: 'Screenshot 3' },
];

describe('ScreenshotCarousel — touch swipe', () => {
  it('renders the carousel', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    expect(screen.getByTestId('screenshot-carousel')).toBeInTheDocument();
  });

  it('shows slide counter', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('renders thumbnail strip for multiple slides', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    expect(screen.getByTestId('thumbnail-0')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
  });

  it('first thumbnail is marked as current', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    expect(screen.getByTestId('thumbnail-0')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('thumbnail-1')).toHaveAttribute('aria-current', 'false');
  });

  it('clicking thumbnail changes current slide', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    fireEvent.click(screen.getByTestId('thumbnail-2'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-2')).toHaveAttribute('aria-current', 'true');
  });

  it('swipe left advances to next slide', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    const carousel = screen.getByRole('region');

    // Swipe left (touchStart at 200, touchEnd at 100 → dist = 100 > 50)
    fireEvent.touchStart(carousel, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(carousel,  { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('swipe right goes to previous slide', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    const carousel = screen.getByRole('region');

    // First go to slide 2
    fireEvent.click(screen.getByTestId('thumbnail-1'));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Swipe right (touchStart at 100, touchEnd at 200 → dist = -100 < -50)
    fireEvent.touchStart(carousel, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(carousel,  { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('swipe less than 50px does not change slide', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    const carousel = screen.getByRole('region');

    // Swipe only 30px — below threshold
    fireEvent.touchStart(carousel, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(carousel,  { targetTouches: [{ clientX: 170 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around from last to first on swipe left', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    const carousel = screen.getByRole('region');

    // Go to last slide
    fireEvent.click(screen.getByTestId('thumbnail-2'));

    // Swipe left from last slide
    fireEvent.touchStart(carousel, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(carousel,  { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(carousel);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('renders placeholder when no slides', () => {
    render(<ScreenshotCarousel slides={[]} productName="Test Product" />);
    expect(screen.getByTestId('carousel-placeholder')).toBeInTheDocument();
  });

  it('renders video embed for video slides', () => {
    const videoSlides = [{ type: 'video' as const, url: 'https://youtube.com/embed/test' }];
    render(<ScreenshotCarousel slides={videoSlides} productName="Test Product" />);
    expect(screen.getByTestId('video-embed')).toBeInTheDocument();
  });

  it('has correct aria attributes for accessibility', () => {
    render(<ScreenshotCarousel slides={SLIDES} productName="Test Product" />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Test Product screenshots');
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  });
});
