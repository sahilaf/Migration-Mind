import { motion } from "framer-motion";

export const ArchitectureSection = () => {
  return (
    <section id="architecture" className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2"
          >
            <span className="text-sm text-muted-foreground">Technical Overview</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            System{" "}
            <span className="text-gradient">Architecture</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Built on proven, scalable technologies for enterprise reliability.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mx-auto max-w-4xl"
        >
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-sm">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[250px] w-[250px] rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[250px] w-[250px] rounded-full bg-primary/10 blur-[80px]" />
            {/* Architecture Diagram */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Frontend Layer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-border/50 bg-background/50 p-6"
              >
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">Frontend</div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">React</div>
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">TypeScript</div>
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">Tailwind CSS</div>
                </div>
              </motion.div>

              {/* Backend Layer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-6"
              >
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">Backend</div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-foreground">Spring Boot</div>
                  <div className="rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-foreground">MCP Protocol</div>
                  <div className="rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-foreground">Rule Engine</div>
                </div>
              </motion.div>

              {/* Data Layer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl border border-border/50 bg-background/50 p-6"
              >
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">Data</div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">Supabase</div>
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">PostgreSQL</div>
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">JWT Auth</div>
                </div>
              </motion.div>
            </div>

            {/* Connection Lines */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
              <span className="text-xs text-muted-foreground">Secure API Communication</span>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/30 via-primary/30 to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default ArchitectureSection;