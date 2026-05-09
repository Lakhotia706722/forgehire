import { Nav } from '@/components/layout/nav';
import { Footer } from '@/components/layout/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
