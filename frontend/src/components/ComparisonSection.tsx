import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const approaches = [
  { name: "Manual", safety: false, flexibility: false },
  { name: "AI-only", safety: false, flexibility: true },
  { name: "Rule-only", safety: true, flexibility: false },
  { name: "MigrationMind (Ours)", safety: true, flexibility: true, highlight: true },
];

export const ComparisonSection = () => {
  return (
    <section id="why-us" className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">Differentiator</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            Why{" "}
            <span className="text-gradient">MigrationMind?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            See how our approach compares to traditional methods.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto max-w-3xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 border-b border-border/50 bg-secondary/30 p-4 text-center">
              <div className="text-left text-sm font-semibold text-foreground">Approach</div>
              <div className="text-sm font-semibold text-foreground">Safety</div>
              <div className="text-sm font-semibold text-foreground">Flexibility</div>
            </div>

            {/* Table Rows */}
            {approaches.map((approach, index) => (
              <motion.div
                key={approach.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`grid grid-cols-3 gap-4 p-4 text-center ${approach.highlight
                  ? "bg-primary/10 border-l-4 border-l-primary"
                  : index % 2 === 0
                    ? "bg-transparent"
                    : "bg-secondary/10"
                  }`}
              >
                <div className={`text-left text-sm ${approach.highlight ? "font-semibold text-primary" : "text-foreground"}`}>
                  {approach.name}
                </div>
                <div className="flex justify-center">
                  {approach.safety ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {approach.flexibility ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Our approach gives you intelligent planning with built-in reliability and safety.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
export default ComparisonSection;