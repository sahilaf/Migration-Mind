import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle2, Layers, FileText } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "JWT Authentication",
    description: "Secure authentication powered by Supabase with industry-standard JWT tokens.",
  },
  {
    icon: Shield,
    title: "No Password Storage",
    description: "Database credentials are never stored - used only during active migration sessions.",
  },
  {
    icon: CheckCircle2,
    title: "Deterministic Validation",
    description: "Every operation passes through validation checks before execution.",
  },
  {
    icon: Layers,
    title: "Batched Migrations",
    description: "Data is migrated in controlled batches with automatic rollback on failure.",
  },
  {
    icon: FileText,
    title: "Validation Reports",
    description: "Comprehensive audit trails and validation reports for compliance requirements.",
  },
];

export const SecuritySection = () => {
  return (
    <section id="security" className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2">
              <span className="text-sm text-muted-foreground">Enterprise Ready</span>
            </div>

            <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Security &{" "}
              <span className="text-gradient">Reliability</span>
            </h2>

            <p className="mb-8 text-lg text-muted-foreground">
              Built from the ground up with security best practices for handling sensitive database operations.
            </p>

            <div className="space-y-4">
              {securityFeatures.slice(0, 3).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            {securityFeatures.slice(3).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30"
              >
                <div className="absolute -right-16 -top-16 h-[120px] w-[120px] rounded-full bg-primary/10 blur-[40px] transition-all group-hover:bg-primary/20" />
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export default SecuritySection;