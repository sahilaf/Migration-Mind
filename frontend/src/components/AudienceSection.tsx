import { motion } from "framer-motion";
import { Code2, Database, Settings, Rocket } from "lucide-react";

const audiences = [
  {
    icon: Code2,
    title: "Backend Engineers",
    description: "Streamline your migration workflows with intelligent automation.",
  },
  {
    icon: Database,
    title: "Database Administrators",
    description: "Maintain full control while reducing manual migration work.",
  },
  {
    icon: Settings,
    title: "DevOps Teams",
    description: "Integrate migrations into your CI/CD pipeline with confidence.",
  },
  {
    icon: Rocket,
    title: "Migration-heavy Startups",
    description: "Scale your data infrastructure without migration nightmares.",
  },
];

export const AudienceSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">Target Users</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            Who is it{" "}
            <span className="text-gradient">for?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Built for teams who need reliable, efficient database migrations.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover-lift"
            >
              <div className="absolute -right-16 -top-16 h-[120px] w-[120px] rounded-full bg-primary/10 blur-[40px] transition-all group-hover:bg-primary/20" />
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-secondary/50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                <audience.icon className="h-6 w-6 text-foreground group-hover:text-primary" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {audience.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {audience.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AudienceSection;