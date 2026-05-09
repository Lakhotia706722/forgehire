'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CarouselSlide {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  alt?: string;
}

interface ScreenshotCarouselProps {
  slides: CarouselSlide[];
  productName: string;
}

export function ScreenshotCarousel({ slides, productName }: ScreenshotCarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const MIN_SWIPE = 50;

  function prev() { setCurrent((c) => (c - 1 + slides.length) % slides.length); }
  function next() { setCurrent((c) => (c + 1) % slides.length); }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (Math.abs(dist) >= MIN_SWIPE) {
      dist > 0 ? next() : prev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  }

  if (!slides.length) {
    return (
      <div
        className="w-full aspect-video bg-bg-elevated rounded-2xl flex items-center justify-center border border-[rgba(255,255,255,0.06)]"
        data-testid="carousel-placeholder"
      >
        <p className="text-text-muted text-sm">No screenshots available</p>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="space-y-3" data-testid="screenshot-carousel">
      {/* Main slide */}
      <div
        className="relative w-full aspect-video bg-bg-elevated rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label={`${productName} screenshots`}
        aria-roledescription="carousel"
      >
        {slide.type === 'video' ? (
          <iframe
            src={slide.url}
            title={`${productName} demo video`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="video-embed"
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-[rgba(0,212,255,0.1)] to-[rgba(123,94,167,0.1)] flex items-center justify-center"
            aria-label={slide.alt ?? `Screenshot ${current + 1}`}
          >
            <p className="text-text-muted text-sm font-mono">Screenshot {current + 1}</p>
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-elevated/80 backdrop-blur-sm border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Previous slide"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 2L4 7l5 5"/>
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-elevated/80 backdrop-blur-sm border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Next slide"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 2l5 5-5 5"/>
              </svg>
            </button>
          </>
        )}

        {/* Slide counter */}
        <div className="absolute bottom-3 right-3 bg-bg-elevated/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-mono text-text-muted">
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" role="list" aria-label="Slide thumbnails">
          {slides.map((s, i) => (
            <button
              key={i}
              role="listitem"
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className={cn(
                'shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-150',
                i === current
                  ? 'border-accent-cyan'
                  : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]'
              )}
              data-testid={`thumbnail-${i}`}
            >
              <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                <span className="text-[8px] font-mono text-text-muted">{i + 1}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
