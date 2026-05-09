import type { Metadata } from 'next';
import { HeroSection } from './_sections/hero';
import { TrustStrip } from './_sections/trust-strip';
import { HowItWorksSection } from './_sections/how-it-works';
import { NeuronScoreExplainerSection } from './_sections/neuron-score-explainer';
import { FeaturedEngineersSection } from './_sections/featured-engineers';
import { MarketplacePreviewSection } from './_sections/marketplace-preview';
import { BountyBoardSection } from './_sections/bounty-board';

export const metadata: Metadata = {
  title: 'NeuronHire — India\'s Only Verified AI Talent Network',
  description:
    'Every AI engineer is assessed, scored, and ranked. Find verified AI talent or get hired for AI projects. Escrow-protected payments. NeuronScore verified.',
  keywords: ['AI engineers India', 'hire AI talent', 'AI marketplace', 'NeuronScore', 'AI jobs India', 'LLM engineers'],
  openGraph: {
    title: 'NeuronHire — India\'s Only Verified AI Talent Network',
    description: 'Every engineer is assessed, scored, and ranked. No noise. Only builders.',
    url: 'https://neuronhire.com',
    siteName: 'NeuronHire',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeuronHire — India\'s AI Talent Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuronHire — India\'s Only Verified AI Talent Network',
    description: 'Every engineer is assessed, scored, and ranked. No noise. Only builders.',
    images: ['/og-image.png'],
  },
};

export default function LandingPage() {
  return (
    <div className="bg-bg-base">
      <HeroSection />
      <TrustStrip />
      <HowItWorksSection />
      <NeuronScoreExplainerSection />
      <FeaturedEngineersSection />
      <MarketplacePreviewSection />
      <BountyBoardSection />
    </div>
  );
}
