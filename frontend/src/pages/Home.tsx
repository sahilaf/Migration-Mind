import { Navbar } from "../components/Nav";
import { HeroSection } from "../components/HeroSection";
import { LogoBar } from "../components/LogoBar";
import { ProblemSection } from "../components/ProblemSection";
import { SolutionSection } from "../components/SolutionSection";
import { HowItWorksSection } from "../components/HowItWorksSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { ComparisonSection } from "../components/ComparisonSection";
import { ArchitectureSection } from "../components/ArchitectureSection";
import { SecuritySection } from "../components/SecuritySection";
import { AudienceSection } from "../components/AudienceSection";
import { CTASection } from "../components/CTASection";
import { Footer } from "../components/Footer";
export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 overflow-hidden selection:bg-orange-500/30 font-sans relative">
      {/* 2. The "God Rays" / Light Beams */}

      {/* Noise Texture (kept for grainy feel) */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
      {/* ========================================= */}
      {/* END BACKGROUND EFFECTS                    */}
      {/* ========================================= */}
      {/* Navigation */}
      <div className="relative z-50">
        <Navbar />
      </div>
      {/* Hero Section */}
      <HeroSection />
      {/* Features Section */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/15 blur-[100px] rounded-full pointer-events-none -z-10" />
        <LogoBar />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ComparisonSection />
        <ArchitectureSection />
        <SecuritySection />
        <AudienceSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
