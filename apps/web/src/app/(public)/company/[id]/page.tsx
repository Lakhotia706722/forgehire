import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompanyHero } from './_components/company-hero';
import { CompanyContent } from './_components/company-content';
import { getMockCompanyById } from '@/lib/mock-data';
import type { CompanyProfile } from '@/lib/mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

interface Props {
  params: { id: string };
}

async function getCompany(id: string): Promise<CompanyProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/company/profiles/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return getMockCompanyById(id);
    const json = await res.json();
    const raw = json?.data ?? json;
    if (!raw?.id) return getMockCompanyById(id);

    const name = String(raw.companyName ?? 'Company');
    const openJobs = Array.isArray(raw.openJobs)
      ? raw.openJobs.map((job: any) => ({
          id: String(job.id),
          title: String(job.title ?? ''),
          mode: String(job.mode ?? 'Job'),
          skills: Array.isArray(job.skills) ? job.skills.map((s: any) => String(s)) : [],
          budget: String(job.budget ?? '—'),
          postedAt: job.postedAt
            ? new Date(String(job.postedAt)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : '—',
        }))
      : [];
    const openBounties = Array.isArray(raw.openBounties)
      ? raw.openBounties.map((b: any) => ({
          id: String(b.id),
          title: String(b.title ?? ''),
          reward: String(b.reward ?? '—'),
          deadline: b.deadline
            ? `${Math.max(0, Math.ceil((new Date(String(b.deadline)).getTime() - Date.now()) / 86_400_000))} days`
            : '—',
          difficulty: String(b.difficulty ?? 'medium'),
        }))
      : [];
    const pastProjects = Array.isArray(raw.pastProjects)
      ? raw.pastProjects.map((p: any) => ({
          id: String(p.id),
          title: String(p.title ?? ''),
          engineerName: String(p.engineerName ?? 'Engineer'),
          completedAt: p.completedAt
            ? new Date(String(p.completedAt)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
            : '—',
          rating: Number(p.rating ?? 5),
          outcome: String(p.outcome ?? 'Delivered successfully'),
        }))
      : [];
    const reviews = Array.isArray(raw.reviews)
      ? raw.reviews.map((r: any) => {
          const engineerName = String(r.engineerName ?? 'Engineer');
          return {
            id: String(r.id),
            engineerName,
            engineerInitials: engineerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
            rating: Number(r.rating ?? 5),
            text: String(r.text ?? ''),
            date: r.date
              ? new Date(String(r.date)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
              : '—',
          };
        })
      : [];

    return {
      id: String(raw.id),
      name,
      description: String(raw.description ?? ''),
      industry: String(raw.industry ?? ''),
      logoInitials: name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      logoColor: '#00D4FF',
      location: String(raw.location ?? ''),
      size: String(raw.size ?? ''),
      website: String(raw.website ?? ''),
      trustScore: Number(raw.trustScore ?? 0),
      websiteVerified: Boolean(raw.websiteVerified),
      gstVerified: Boolean(raw.gstVerified),
      tasksPosted: Number(raw.taskCount ?? 0),
      engineersHired: Number(raw.contractCount ?? 0),
      spendRange: '—',
      avgRating: 4.5,
      responseRate: 90,
      avgResponseTime: '< 4h',
      hiringSuccessRate: 85,
      repeatHireRate: 60,
      openJobs,
      openBounties,
      pastProjects,
      reviews,
    };
  } catch {
    return getMockCompanyById(id);
  }
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
