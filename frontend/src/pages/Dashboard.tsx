'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import SettingsPanel from './Settings';
import {
  Database,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Zap,
  AlertCircle,
  Eye,
  FileText,
  ChevronRight,
  Activity,
  Sliders,
  Home as HomeIcon,
  History,
} from 'lucide-react';

// Types
interface MigrationMetric {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
}

interface MigrationStep {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'pending';
  icon: React.ReactNode;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, session, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // State for migrations from backend
  const [migrations, setMigrations] = useState<any[]>([]);
  const [migrationsLoading, setMigrationsLoading] = useState(true);
  const [migrationsError, setMigrationsError] = useState<string | null>(null);
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [loading, session, navigate]);

  // Fetch migrations for the user
  useEffect(() => {
    const fetchMigrations = async () => {
      if (!user) return;

      try {
        setMigrationsLoading(true);
        const response = await fetch(`http://localhost:8080/api/migrations/user/${user.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch migrations');
        }

        const data = await response.json();
        setMigrations(data.migrations || []);
        setMigrationsError(null);
      } catch (error: any) {
        console.error('Error fetching migrations:', error);
        setMigrationsError(error.message);
        setMigrations([]);
      } finally {
        setMigrationsLoading(false);
      }
    };

    if (user) {
      fetchMigrations();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Function to refresh migrations list
  const refreshMigrations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:8080/api/migrations/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMigrations(data.migrations || []);
      }
    } catch (error) {
      console.error('Error refreshing migrations:', error);
    }
  };

  // Function to generate migration plan for a migration
  const generateMigrationPlan = async (migrationId: string) => {
    setGeneratingPlanId(migrationId);
    try {
      const response = await fetch(
        `http://localhost:8080/api/mongo/migration-plan/generate/${migrationId}`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (response.ok) {
        alert('✅ Migration plan generated successfully!');
        // Refresh the migrations list to show the new plan
        await refreshMigrations();
      } else {
        alert(`❌ Failed to generate plan: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('❌ Failed to generate migration plan');
    } finally {
      setGeneratingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Mock data
  const metrics: MigrationMetric[] = [
    {
      label: 'Active Migrations',
      value: '2',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: 'Total Data Migrated',
      value: '2.4M',
      trend: '↑ 15%',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: 'Avg Migration Time',
      value: '3.2 min',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      label: 'Success Rate',
      value: '98%',
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  const steps: MigrationStep[] = [
    {
      id: 1,
      name: 'Connect',
      status: 'complete',
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: 2,
      name: 'Analyze',
      status: 'complete',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 3,
      name: 'Configure',
      status: 'current',
      icon: <Sliders className="h-4 w-4" />,
    },
    {
      id: 4,
      name: 'Execute',
      status: 'pending',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 5,
      name: 'Validate',
      status: 'pending',
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  // Show Settings Panel instead of Dashboard
  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 relative font-sans selection:bg-orange-500/30">

      {/* --- ATMOSPHERIC BACKGROUND EFFECTS (Fixed) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 1. Dust/Particles */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)'
          }}>
        </div>

        {/* 2. Top God Rays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* 3. Horizon Glow */}
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[500px] border-t border-orange-500/30 rounded-[100%] bg-gradient-to-b from-orange-900/10 to-transparent blur-[60px] pointer-events-none"></div>
      </div>

      {/* --- TOP NAVIGATION (Fixed) --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl h-16">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors md:hidden text-slate-400 hover:text-white"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              <h1 className="text-2xl font-bold text-white hover:opacity-80 transition">
                Migration Mind
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 gap-8">

            <nav className="flex gap-6">
              {[
                { icon: <HomeIcon className="h-4 w-4" />, label: 'Dashboard' },
                { icon: <Activity className="h-4 w-4" />, label: 'Migrations' },
                { icon: <History className="h-4 w-4" />, label: 'History' },
                { icon: <Settings className="h-4 w-4" />, label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.label === 'Settings' && setShowSettings(true)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-500 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-slate-400">{user?.email || 'admin@darken.io'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- SIDEBAR - DESKTOP (Fixed Layout) --- */}
      {/* Fixed position, sitting below the nav (top-16), full height to bottom, fixed width */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/5 z-40 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {['Start New Migration', 'View Templates', 'Recent Jobs'].map((action) => (
                  <button
                    key={action}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-400 hover:text-orange-400 border border-transparent hover:border-white/5"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Recent Migrations
              </h3>
              <div className="space-y-2">
                {['E-commerce DB', 'Analytics Migration', 'User Management'].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-400 hover:text-white flex items-center justify-between group"
                  >
                    {item}
                    <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- SIDEBAR - MOBILE (Overlay) --- */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/5 p-6 overflow-y-auto z-40 md:hidden"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) {
            setSidebarOpen(false);
          }
        }}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {['Start New Migration', 'View Templates', 'Recent Jobs'].map((action) => (
                <button
                  key={action}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-400 hover:text-orange-400"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
          {/* Mobile Sidebar Content continues... */}
        </div>
      </motion.div>


      {/* --- MAIN CONTENT (Adjusted for Layout) --- */}
      {/* md:ml-72 adds the margin to offset the fixed sidebar */}
      <main className="pt-24 pb-8 md:ml-72 relative z-10 min-h-screen transition-all duration-300">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div
            variants={itemVariants}
            className="mb-8 bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 overflow-hidden relative group shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Subtle orange glow inside card */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-600/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-2 text-white">Database Migration Made Simple</h2>
              <p className="text-lg text-slate-400 mb-6">Connect → Analyze → Migrate with <span className="text-orange-500">AI Power</span></p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] font-bold transition-all transform hover:scale-105">
                  Start New Migration
                </button>
                <button className="px-6 py-3 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 font-semibold transition-all backdrop-blur-sm">
                  Load Template
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-500" /> 15 Migrations Completed</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-500" /> 2.4M Records Migrated</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-orange-500" /> 98% Success Rate</div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-orange-500/30 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                    {metric.icon}
                  </div>
                  {metric.trend && <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">{metric.trend}</span>}
                </div>
                <div className="text-3xl font-bold mb-1 text-white">{metric.value}</div>
                <div className="text-sm text-slate-500">{metric.label}</div>
              </motion.div>
            ))}
          </motion.div>


          {/* Migration Workflow Steps */}
          <motion.div variants={itemVariants} className="mb-8 bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-6">
            <h3 className="text-lg font-bold mb-6 text-white">Migration Workflow</h3>
            <div className="flex justify-between items-center relative">
              {/* Line connecting steps */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/5 -z-0"></div>

              {steps.map((step) => (
                <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${step.status === 'complete'
                      ? 'bg-[#0a0a0a] text-green-500 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      : step.status === 'current'
                        ? 'bg-orange-600 text-white border border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.5)]'
                        : 'bg-[#111] text-slate-600 border border-white/10'
                      }`}
                  >
                    {step.status === 'current' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>{step.icon}</motion.div>}
                    {step.status !== 'current' && step.icon}
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wider ${step.status === 'current' ? 'text-orange-500' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Migrations Table */}
          <motion.div variants={itemVariants} className="mb-8 bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Your Migrations</h3>
              {migrations.length > 0 && (
                <span className="text-sm text-slate-500">
                  {migrations.length} total migration{migrations.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              {migrationsLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-slate-400">Loading migrations...</p>
                </div>
              ) : migrationsError ? (
                <div className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 mb-2">Failed to load migrations</p>
                  <p className="text-sm text-slate-500">{migrationsError}</p>
                </div>
              ) : migrations.length === 0 ? (
                <div className="p-12 text-center">
                  <Database className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No migrations yet</p>
                  <p className="text-sm text-slate-500">Start your first migration to see it here</p>
                  <button
                    onClick={() => navigate('/mongo-analysis')}
                    className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                  >
                    Start New Migration
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500">
                      <th className="px-6 py-3 text-left font-semibold">Name</th>
                      <th className="px-6 py-3 text-left font-semibold">Database</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Last Analyzed</th>
                      <th className="px-6 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {migrations.map((migration: any) => (
                      <motion.tr
                        key={migration.id}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{migration.name}</div>
                          {migration.hasAnalysis && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span className="text-xs text-green-400">Analysis saved</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {migration.sourceDatabase ? (
                            <div>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Database className="h-4 w-4 text-orange-500" />
                                <span className="font-mono text-sm">{migration.sourceDatabase}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {migration.sourceHost}:{migration.sourcePort}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">Not connected</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${migration.status === 'COMPLETED'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : migration.status === 'FAILED'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : migration.status === 'RUNNING'
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}
                            >
                              {migration.status === 'RUNNING' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-current"></motion.div>}
                              {migration.status === 'COMPLETED' && <CheckCircle className="h-3 w-3" />}
                              {migration.status === 'FAILED' && <AlertCircle className="h-3 w-3" />}
                              {migration.status}
                            </span>
                            {migration.hasMigrationPlan && (
                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Has migration plan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {migration.lastAnalyzedAt ? (
                            <div>
                              <div className="text-slate-300">
                                {new Date(migration.lastAnalyzedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(migration.lastAnalyzedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">Not analyzed</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {migration.hasAnalysis && migration.sourceDatabase && (
                              <button
                                onClick={() => {
                                  // Navigate to MongoAnalysis with params to load existing analysis
                                  const params = new URLSearchParams({
                                    migrationId: migration.id,
                                    host: migration.sourceHost || '',
                                    port: String(migration.sourcePort || 27017),
                                    database: migration.sourceDatabase || '',
                                    autoLoad: 'true'
                                  });
                                  navigate(`/mongo-analysis?${params.toString()}`);
                                }}
                                className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors text-xs font-medium flex items-center gap-1 border border-orange-500/20"
                              >
                                <Eye className="h-3 w-3" />
                                View Analysis
                              </button>
                            )}
                            {migration.hasMigrationPlan && (
                              <button
                                onClick={() => {
                                  // Navigate to MongoAnalysis with params to view the plan
                                  const params = new URLSearchParams({
                                    migrationId: migration.id,
                                    host: migration.sourceHost || '',
                                    port: String(migration.sourcePort || 27017),
                                    database: migration.sourceDatabase || '',
                                    autoLoad: 'true',
                                    tab: 'plan'
                                  });
                                  navigate(`/mongo-analysis?${params.toString()}`);
                                }}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-medium flex items-center gap-1 border border-blue-500/20"
                              >
                                <FileText className="h-3 w-3" />
                                View Plan
                              </button>
                            )}
                            {migration.hasAnalysis && !migration.hasMigrationPlan && (
                              <button
                                onClick={() => generateMigrationPlan(migration.id)}
                                disabled={generatingPlanId === migration.id}
                                className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-xs font-medium flex items-center gap-1 border border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {generatingPlanId === migration.id ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3" />
                                    Generate Plan
                                  </>
                                )}
                              </button>
                            )}
                            {!migration.hasAnalysis && (
                              <button
                                onClick={() => {
                                  navigate('/mongo-analysis');
                                }}
                                className="px-3 py-1.5 bg-slate-500/10 text-slate-400 rounded-lg hover:bg-slate-500/20 transition-colors text-xs font-medium border border-slate-500/20"
                              >
                                Analyze
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>


          {/* System Health Indicator */}
          <motion.div variants={itemVariants} className="bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-6 max-w-md">
            <h3 className="text-lg font-bold mb-6 text-white">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-slate-400">Database</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-green-400">Connected</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-slate-400">AI Engine</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-400">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-slate-400">Threads</span>
                <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">5/10 active</span>
              </div>

              <div className="border-t border-white/5 pt-4 mt-auto">
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Server: US-EAST-1</span>
                  <span>Ping: 24ms</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Responsive mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}