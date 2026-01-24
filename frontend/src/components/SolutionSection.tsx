import { motion } from "framer-motion";
import { Sparkles, Shield, UserCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    label: "Analyze",
    description: "Intelligent analysis of your schema generates optimal migration paths",
  },
  {
    icon: Shield,
    label: "Validate",
    description: "Built-in validation ensures safety and data integrity",
  },
  {
    icon: UserCheck,
    label: "Approve",
    description: "You review and approve every change before execution",
  },
];

export const SolutionSection = () => {
  return (
    <section id="solution" className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">The Approach</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            The best of{" "}
            <span className="text-gradient">both worlds</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Intelligent planning with built-in safety for migrations you can trust.
          </motion.p>
        </div>

        {/* Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mx-auto max-w-4xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl" />
          <div className="relative rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
              {steps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{step.label}</h3>
                    <p className="max-w-[200px] text-sm text-muted-foreground">{step.description}</p>
                  </motion.div>

                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden h-6 w-6 text-primary/50 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default SolutionSection;