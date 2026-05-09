import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — NeuronHire',
  description: 'NeuronHire Privacy Policy and DPDP Act compliance information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-text-muted text-sm">Last updated: May 1, 2026</p>
        </div>

        {[
          {
            title: '1. Information We Collect',
            content: 'We collect information you provide directly to us, such as when you create an account, complete your profile, or contact us for support. This includes your name, email address, professional information, and payment details. We also collect information automatically when you use our platform, including usage data, device information, and cookies.',
          },
          {
            title: '2. How We Use Your Information',
            content: 'We use the information we collect to provide, maintain, and improve our services; process transactions; send you technical notices and support messages; respond to your comments and questions; and send you information about products, services, and events offered by NeuronHire.',
          },
          {
            title: '3. Information Sharing',
            content: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described in this policy. We may share your information with companies and engineers on the platform as necessary to facilitate hiring and project work, with your consent.',
          },
          {
            title: '4. DPDP Act Compliance',
            content: 'NeuronHire complies with the Digital Personal Data Protection Act, 2023 (DPDP Act). As a Data Fiduciary, we process your personal data only for lawful purposes with your consent. You have the right to access, correct, and erase your personal data. You may withdraw consent at any time through your account settings.',
          },
          {
            title: '5. Data Retention',
            content: 'We retain your personal data for as long as your account is active or as needed to provide you services. Financial records including invoices are retained for 7 years as required by Indian tax law. You may request deletion of your account and associated data at any time.',
          },
          {
            title: '6. Security',
            content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.',
          },
          {
            title: '7. Contact Us',
            content: 'If you have questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@neuronhire.com.',
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
