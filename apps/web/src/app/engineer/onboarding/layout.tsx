/** Full-screen wizard — no engineer dashboard chrome from parent padding */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full">{children}</div>;
}
