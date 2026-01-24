import { motion } from "framer-motion";
import { Database, Download, Cpu, UserCheck, Zap, FileCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Connect source & target databases",
    description: "Securely connect to your source and destination databases with encrypted credentials.",
  },
  {
    number: "02",
    icon: Download,
    title: "Import schema using MCP",
    description: "Automatically extract and analyze your database schema using the Model Context Protocol.",
  },
  {
    number: "03",
    icon: Cpu,
    title: "Generate migration plan",
    description: "Intelligent planning generates an optimized migration strategy with built-in validation.",
  },
  {
    number: "04",
    icon: UserCheck,
    title: "Review and approve plan",
    description: "Review the complete migration plan with full visibility before any changes are made.",
  },
  {
    number: "05",
    icon: Zap,
    title: "Execute multi-threaded migration",
    description: "Run migrations in parallel with real-time progress monitoring and error handling.",
  },
  {
    number: "06",
    icon: FileCheck,
    title: "Validate and download report",
    description: "Comprehensive validation ensures data integrity, with downloadable audit reports.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">Step by Step</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            How it{" "}
            <span className="text-gradient">works</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            A simple, transparent process that keeps you in control at every step.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover-lift"
            >
              <div className="absolute -right-16 -top-16 h-[150px] w-[150px] rounded-full bg-primary/10 blur-[50px] transition-all group-hover:bg-primary/20" />
              <div className="absolute right-4 top-4 text-5xl font-bold text-muted/20">
                {step.number}
              </div>

              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-secondary/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                  <step.icon className="h-5 w-5 text-foreground group-hover:text-primary" />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default HowItWorksSection;