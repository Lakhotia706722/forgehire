import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_ENGINEER } from '@/lib/mock-data';
import { ProfileHero } from './_components/profile-hero';
import { ProfileContent } from './_components/profile-content';

interface Props {
  params: { id: string };
}

/**
 * SSR: data is fetched server-side — no client-only data fetching.
 * In production, replace MOCK_ENGINEER with an API call:
 *   const engineer = await fetch(`${API_URL}/api/engineer/${params.id}`).then(r => r.json())
 */
async function getEngineer(id: string) {
  // Simulate DB lookup — in production this is a real fetch
  if (id === MOCK_ENGINEER.id || id) {
    return { ...MOCK_ENGINEER, id };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const engineer = await getEngineer(params.id);
  if (!engineer) return { title: 'Engineer Not Found' };

  const title = `${engineer.name} — ${engineer.tier} AI Engineer | NeuronHire`;
  const description = `${engineer.headline}. NeuronScore ${engineer.neuronScore}. ${engineer.reviewCount} reviews. ${engineer.projectCount} projects. Available on NeuronHire.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://neuronhire.com/engineer/${params.id}`,
      type: 'profile',
      images: [
        {
          url: `/api/og/engineer/${params.id}`,
          width: 1200,
          height: 630,
          alt: `${engineer.name} — NeuronHire Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/engineer/${params.id}`],
    },
  };
}

export default async function EngineerProfilePage({ params }: Props) {
  const engineer = await getEngineer(params.id);
  if (!engineer) notFound();

  return (
    <div className="bg-bg-base min-h-screen">
      {/* Hero — server rendered, no layout shift */}
      <ProfileHero engineer={engineer} />

      {/* Tabs + content — client interactive */}
      <ProfileContent engineer={engineer} />
    </div>
  );
}
