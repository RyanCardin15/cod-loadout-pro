import { HeroEnhanced } from '@/components/landing/HeroEnhanced';
import { Features } from '@/components/landing/Features';
import { MetaPreview } from '@/components/landing/MetaPreview';
import { Stats } from '@/components/landing/Stats';
import { CTA } from '@/components/landing/CTA';
import { AuthModal } from '@/components/auth/AuthModal';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroEnhanced />
      <Stats />
      <Features />
      <MetaPreview />
      <CTA />
      <AuthModal />
    </div>
  );
}
