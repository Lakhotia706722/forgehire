import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — NeuronHire',
  description: 'NeuronHire Terms of Service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
          <p className="text-text-muted text-sm">Last updated: May 1, 2026</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            content: 'By accessing or using NeuronHire, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.',
          },
          {
            title: '2. Platform Description',
            content: 'NeuronHire is an AI-exclusive talent marketplace that connects verified AI engineers with companies. We facilitate hiring, project work, bounties, and the sale of AI products and tools.',
          },
          {
            title: '3. User Accounts',
            content: 'You must create an account to use most features of NeuronHire. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
          },
          {
            title: '4. Engineer Verification',
            content: 'Engineers on NeuronHire undergo a skills assessment to receive a NeuronScore. This score is based on demonstrated technical ability and is updated based on platform activity. NeuronHire reserves the right to adjust scores based on verified performance data.',
          },
          {
            title: '5. Payments and Escrow',
            content: 'All payments for project work are held in escrow and released upon milestone completion. NeuronHire charges a platform fee on all transactions. Payouts are processed within 2-24 hours depending on the payment method.',
          },
          {
            title: '6. Prohibited Activities',
            content: 'You may not use NeuronHire to engage in fraudulent activity, share contact information to circumvent platform payments, submit plagiarized work, or violate any applicable laws. Violations may result in account suspension.',
          },
          {
            title: '7. Intellectual Property',
            content: 'Work product created under contracts belongs to the company unless otherwise specified in the contract. Products listed on the marketplace remain the intellectual property of the engineer unless explicitly transferred.',
          },
          {
            title: '8. Dispute Resolution',
            content: 'Disputes between engineers and companies are handled through our dispute resolution process. NeuronHire\'s decision in disputes is final. All disputes are governed by Indian law and subject to the jurisdiction of courts in Bangalore, Karnataka.',
          },
          {
            title: '9. Contact',
            content: 'For questions about these Terms, contact us at legal@neuronhire.com.',
          },
        ].map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="font-display font-semibold text-text-primary text-lg">{section.title}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
