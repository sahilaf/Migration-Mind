import { motion } from "framer-motion";
import { Database, Github, Mail } from "lucide-react";

const footerLinks = {
  Product: ["Features", "How It Works", "Pricing", "Changelog"],
  Resources: ["Documentation", "API Reference", "Guides", "Support"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Security"],
};

const techStack = ["React", "Spring Boot", "MCP", "Supabase", "PostgreSQL"];

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-6">
          {/* Logo & Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <a href="#" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Database className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">MigrateDB</span>
            </a>

            <p className="mb-6 text-sm text-muted-foreground">
              Database Migration Platform. Safe, efficient, and reliable.
            </p>

            <div className="mb-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tech Stack
              </div>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-border/50 bg-secondary/30 px-2 py-1 text-xs text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * categoryIndex }}
            >
              <h4 className="mb-4 text-sm font-semibold text-foreground">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-8 sm:flex-row"
        >
          <p className="text-sm text-muted-foreground">
            © 2024 MigrateDB. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Security
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
export default Footer;