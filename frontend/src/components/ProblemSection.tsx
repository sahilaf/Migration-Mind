import { motion } from "framer-motion";
import { AlertTriangle, XCircle, Eye, RotateCcw } from "lucide-react";

const problems = [
  {
    icon: XCircle,
    title: "Manual scripts are error-prone",
    description: "Hand-written migration scripts lead to typos, missed dependencies, and data corruption.",
  },
  {
    icon: AlertTriangle,
    title: "AI-only tools are unsafe",
    description: "Pure AI approaches can hallucinate queries and make unpredictable changes to your data.",
  },
  {
    icon: Eye,
    title: "No visibility during migration",
    description: "Most tools leave you blind during execution, with no way to monitor progress or catch issues.",
  },
  {
    icon: RotateCcw,
    title: "Rollbacks are hard",
    description: "When something goes wrong, recovering your original state is often complex or impossible.",
  },
];

export const ProblemSection = () => {
  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            Why database migrations{" "}
            <span className="text-gradient">fail</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground"
          >
            Traditional approaches leave teams frustrated and databases at risk.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-destructive/40"
            >
              <div className="absolute -right-20 -top-20 h-[150px] w-[150px] rounded-full bg-destructive/10 blur-[50px] transition-all group-hover:bg-destructive/20" />
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <problem.icon className="h-6 w-6 text-destructive" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {problem.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ProblemSection;