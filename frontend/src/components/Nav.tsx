import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Database, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Us", href: "#why-us" },
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/20 backdrop-blur-xl"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <a href="#" className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-bold text-foreground">Migration Mind</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Button variant="ghost" size="sm">
            Documentation
          </Button>
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate('/mongo-analysis');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Database className="h-4 w-4" />
                    MongoDB Analysis
                  </button>
                  <button
                    onClick={async () => {
                      await signOut();
                      setShowUserMenu(false);
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate('/signup')}>
              Start Migration
            </Button>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-foreground lg:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-b border-border/40 bg-background/20 backdrop-blur-xl lg:hidden"
        >
          <div className="container mx-auto flex flex-col gap-4 px-4 py-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {loading ? (
              <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-muted" />
            ) : user ? (
              <div className="mt-4 space-y-2">
                <Button
                  variant="hero"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigate('/dashboard');
                    setIsOpen(false);
                  }}
                >
                  <UserIcon className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={async () => {
                    await signOut();
                    setIsOpen(false);
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="hero"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  navigate('/signup');
                  setIsOpen(false);
                }}
              >
                Start Migration
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};
