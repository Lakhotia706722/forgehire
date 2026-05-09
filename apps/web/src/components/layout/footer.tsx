import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Find Engineers', href: '/engineers' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Bounty Board', href: '/bounties' },
  { label: 'NeuronScore', href: '/neuron-score' },
  { label: 'Pricing', href: '/pricing' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'DPDP Compliance', href: '/dpdp' },
  { label: 'Refund Policy', href: '/refunds' },
];

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-bg-surface mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="NeuronHire home">
              <div className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="2" fill="#080B14"/>
                </svg>
              </div>
              <span className="font-display font-bold text-text-primary text-lg">NeuronHire</span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-[200px]">
              India&apos;s only AI-exclusive talent and product marketplace.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              <SocialLink href="https://github.com/neuronhire" label="GitHub">
                <GitHubIcon />
              </SocialLink>
              <SocialLink href="https://linkedin.com/company/neuronhire" label="LinkedIn">
                <LinkedInIcon />
              </SocialLink>
              <SocialLink href="https://twitter.com/neuronhire" label="Twitter / X">
                <TwitterIcon />
              </SocialLink>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h3 className="font-display font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h3 className="font-display font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <h3 className="font-display font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} NeuronHire Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-text-muted text-xs font-mono">
            Built for India&apos;s AI Community 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-lg bg-bg-elevated border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-text-muted hover:text-accent-cyan hover:border-[rgba(0,212,255,0.3)] transition-all duration-200"
    >
      {children}
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
