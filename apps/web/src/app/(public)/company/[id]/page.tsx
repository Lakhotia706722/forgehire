import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_COMPANY } from '@/lib/mock-data';
import { CompanyHero } from './_components/company-hero';
import { CompanyContent } from './_components/company-content';

interface Props {
  params: { id: string };
}

async function getCompany(id: string) {
  if (id === MOCK_COMPANY.id || id) {
    return { ...MOCK_COMPANY, id };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompany(params.id);
  if (!company) return { title: 'Company Not Found' };

  const title = `${company.name} — ${company.industry} | NeuronHire`;
  const description = `${company.description.slice(0, 155)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://neuronhire.com/company/${params.id}`,
      type: 'profile',
      images: [{ url: `/api/og/company/${params.id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/company/${params.id}`],
    },
  };
}

export default async function CompanyProfilePage({ params }: Props) {
  const company = await getCompany(params.id);
  if (!company) notFound();

  return (
    <div className="bg-bg-base min-h-screen">
      <CompanyHero company={company} />
      <CompanyContent company={company} />
    </div>
  );
}
