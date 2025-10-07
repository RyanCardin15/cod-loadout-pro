import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { MetaPreview } from '@/components/landing/MetaPreview';
import { Stats } from '@/components/landing/Stats';
import { CTA } from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Stats />
      <Features />
      <MetaPreview />
      <CTA />
    </div>
  );
}
