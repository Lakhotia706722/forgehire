// Trust strip — infinite marquee of company logos (placeholder shapes)
const COMPANIES = [
  'Sarvam AI', 'Krutrim', 'Ola Electric', 'Zepto', 'Meesho',
  'Razorpay', 'CRED', 'Groww', 'PhonePe', 'Swiggy',
  'Zomato', 'Nykaa', 'Paytm', 'Flipkart', 'Infosys',
];

export function TrustStrip() {
  return (
    <section className="py-8 border-y border-[rgba(255,255,255,0.04)] overflow-hidden" aria-label="Companies that have hired on NeuronHire">
      <p className="text-center text-xs font-mono text-text-muted uppercase tracking-widest mb-6">
        Trusted by India&apos;s leading AI teams
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg-base to-transparent z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg-base to-transparent z-10 pointer-events-none" aria-hidden="true" />

        {/* Marquee track — duplicate for seamless loop */}
        <div className="flex animate-marquee whitespace-nowrap" aria-hidden="true">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <LogoPlaceholder key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center mx-8 h-10 opacity-40 hover:opacity-70 transition-opacity">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-bg-surface">
        <div className="w-4 h-4 rounded bg-[rgba(255,255,255,0.15)]" />
        <span className="text-sm font-medium text-text-secondary whitespace-nowrap">{name}</span>
      </div>
    </div>
  );
}
