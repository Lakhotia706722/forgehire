import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileHero } from './_components/profile-hero';
import { ProfileContent } from './_components/profile-content';
import { mapApiEngineerToPublicProfile } from '@/lib/map-api-engineer-profile';
import { getMockEngineerById } from '@/lib/mock-data';
import type { EngineerProfile } from '@/lib/mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

interface Props {
  params: { id: string };
}

async function getEngineer(id: string): Promise<EngineerProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/engineer/profiles/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return getMockEngineerById(id);
    const json = await res.json();
    const data = json?.data ?? json;
    if (!data?.id) return getMockEngineerById(id);
    return mapApiEngineerToPublicProfile(data as Record<string, unknown>);
  } catch {
    return getMockEngineerById(id);
  }
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
