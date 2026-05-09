import { ImageResponse } from 'next/og';
import { MOCK_ENGINEER } from '@/lib/mock-data';

export const runtime = 'edge';

const TIER_COLORS: Record<string, string> = {
  Elite:        '#F59E0B',
  Professional: '#00D4FF',
  Verified:     '#7B5EA7',
  Conditional:  '#4A5568',
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // In production: fetch from DB/API
  const engineer = { ...MOCK_ENGINEER, id: params.id };
  const tierColor = TIER_COLORS[engineer.tier] ?? '#00D4FF';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#080B14',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${tierColor}15 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,94,167,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 80px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#00D4FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '14px', height: '14px', background: '#080B14', borderRadius: '2px' }} />
            </div>
            <span style={{ color: '#F0F4FF', fontSize: '20px', fontWeight: 700 }}>NeuronHire</span>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flex: 1 }}>
            {/* Avatar */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: engineer.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: 700,
                color: '#080B14',
                border: `4px solid ${tierColor}`,
                flexShrink: 0,
              }}
            >
              {engineer.avatarInitials}
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#F0F4FF', fontSize: '42px', fontWeight: 800 }}>
                  {engineer.name}
                </span>
                <span
                  style={{
                    background: `${tierColor}20`,
                    border: `1px solid ${tierColor}40`,
                    color: tierColor,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {engineer.tier}
                </span>
              </div>
              <span style={{ color: '#8892A4', fontSize: '20px' }}>{engineer.headline}</span>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: tierColor, fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {engineer.neuronScore}
                  </span>
                  <span style={{ color: '#4A5568', fontSize: '12px' }}>NeuronScore</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#F0F4FF', fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {engineer.reviewCount}
                  </span>
                  <span style={{ color: '#4A5568', fontSize: '12px' }}>Reviews</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#F0F4FF', fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {engineer.projectCount}
                  </span>
                  <span style={{ color: '#4A5568', fontSize: '12px' }}>Projects</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#00D4FF', fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
                    ₹{engineer.hourlyRateINR.toLocaleString('en-IN')}/hr
                  </span>
                  <span style={{ color: '#4A5568', fontSize: '12px' }}>Hourly Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: '#4A5568', fontSize: '14px' }}>neuronhire.com/engineer/{params.id}</span>
            <span style={{ color: '#4A5568', fontSize: '14px' }}>India&apos;s AI Talent Marketplace</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
