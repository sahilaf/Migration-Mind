import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Database, Cpu, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LightRays from "../components/LightRays";
import Particles from "../components/Particles";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartMigration = () => {
    if (user) {
      navigate('/mongo-analysis');
    } else {
      navigate('/signup', { state: { redirectTo: '/mongo-analysis' } });
    }
  };

  const handleDocumentation = () => {
    navigate('/documentation');
  };

  return (
    <section className="relative h-screen pt-16 mb-32">
      <div className="w-screen h-full bg-transparent absolute">
        <LightRays
          raysOrigin="top-center"
          raysColor="#fa9332"
          raysSpeed={1}
          lightSpread={0.8}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.01}
          distortion={0.02}
          className="custom-rays"
        />
      </div>

      <div className="absolute w-screen h-full">
        <Particles
          particleColors={["#ffffff", "#fa9332"]}
          particleCount={200}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={10}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 gradient-hero" />


      <div className="container relative mx-auto px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Built with Spring Boot, MCP, Supabase</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            <span className="text-gradient">Database Migration</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground lg:text-xl"
          >
            Safely migrate databases with intelligent planning and multi-threaded execution.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button variant="hero" size="lg" className="group" onClick={handleStartMigration}>
              Start Migration
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="hero-outline" size="lg" className="group" onClick={handleDocumentation}>
              <FileText className="h-4 w-4" />
              Documentation
            </Button>
          </motion.div>
        </div>

        {/* Migration Flow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-1 shadow-card backdrop-blur-sm">
            <div className="rounded-xl bg-gradient-to-b from-secondary/50 to-card p-6 lg:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-destructive/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-sm text-muted-foreground">Migration Pipeline</div>
              </div>

              {/* Migration Flow Visualization */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {[
                  { icon: Database, label: "Schema", sublabel: "Import" },
                  { icon: Cpu, label: "Migration Plan", sublabel: "Generate" },
                  { icon: Shield, label: "User Review", sublabel: "Approve" },
                  { icon: ArrowRight, label: "Migration", sublabel: "Execute" },
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-background/50">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-foreground">{step.label}</span>
                      <span className="text-xs text-muted-foreground">{step.sublabel}</span>
                    </div>
                    {i < 3 && (
                      <div className="hidden h-0.5 w-12 bg-gradient-to-r from-primary/60 to-primary/20 lg:block" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl bg-background/40 p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">99.9%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10x</div>
                  <div className="text-xs text-muted-foreground">Faster Migration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">Zero</div>
                  <div className="text-xs text-muted-foreground">Data Loss</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
