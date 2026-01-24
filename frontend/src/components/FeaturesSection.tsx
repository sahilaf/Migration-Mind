import { motion } from "framer-motion";
import { Database, Cpu, Zap, Activity, FileCheck } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "MCP-Based Schema Import",
    description: "Leverage Model Context Protocol for intelligent, automated schema extraction and analysis.",
  },
  {
    icon: Cpu,
    title: "Migration Engine",
    description: "Intelligent migration planning with built-in safety checks to ensure consistency and reliability.",
  },
  {
    icon: Zap,
    title: "Multi-Threaded Execution",
    description: "Parallel migration execution for maximum performance without sacrificing reliability.",
  },
  {
    icon: Activity,
    title: "Live Progress Monitoring",
    description: "Real-time visibility into migration status, with instant alerts for any issues.",
  },
  {
    icon: FileCheck,
    title: "Post-Migration Validation",
    description: "Automated data integrity checks and comprehensive audit reports after every migration.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">MVP Features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            Key{" "}
            <span className="text-gradient">Features</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Everything you need for safe, efficient database migrations.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover-lift ${index === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute -right-20 -top-20 h-[200px] w-[200px] rounded-full bg-primary/20 blur-[60px] transition-all group-hover:bg-primary/30" />

              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-secondary/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                  <feature.icon className="h-6 w-6 text-foreground group-hover:text-primary" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;