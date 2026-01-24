import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Book,
    Database,
    Zap,
    Shield,
    Code,
    FileText,
    Settings,
    CheckCircle,
    ArrowRight,
    ChevronRight,
    Home,
    Play,
    AlertCircle
} from 'lucide-react';

const Documentation = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('getting-started');

    const sections = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: Play,
            content: {
                title: 'Getting Started with MigrationMind',
                description: 'Learn how to set up and run your first database migration in minutes.',
                subsections: [
                    {
                        title: 'Prerequisites',
                        content: `Before you begin, ensure you have:
• A source MongoDB database with data to migrate
• A target PostgreSQL database (can be empty)
• Database credentials for both source and target
• Network access to both databases`
                    },
                    {
                        title: 'Quick Start',
                        content: `1. Sign up for a MigrationMind account
2. Navigate to MongoDB Analysis page
3. Enter your MongoDB connection details
4. Click "Test Connection" to verify connectivity
5. Click "Run Analysis" to analyze your schema
6. Review the discovered schema, relationships, and risks
7. Generate a migration plan
8. Review and approve the plan
9. Execute the migration`
                    },
                    {
                        title: 'First Migration',
                        content: `Your first migration is simple:
1. Start from the Dashboard
2. Click "Start New Migration"
3. Follow the step-by-step wizard
4. Monitor progress in real-time
5. Download validation reports when complete`
                    }
                ]
            }
        },
        {
            id: 'mongodb-analysis',
            title: 'MongoDB Analysis',
            icon: Database,
            content: {
                title: 'MongoDB Schema Analysis',
                description: 'Understand how MigrationMind analyzes your MongoDB database.',
                subsections: [
                    {
                        title: 'Connection Methods',
                        content: `MigrationMind supports two connection methods:

**Standard Connection:**
• Host: Your MongoDB server address
• Port: Default is 27017
• Database: Name of your database
• Username/Password: Optional authentication

**MongoDB Atlas:**
• Use the connection string format
• Paste your full connection string
• Credentials are automatically extracted
• Example: mongodb+srv://user:pass@cluster.mongodb.net/database`
                    },
                    {
                        title: 'Schema Discovery',
                        content: `The analysis process:
• Samples documents from each collection
• Identifies field types and patterns
• Detects nested structures and arrays
• Calculates field frequency
• Determines required vs optional fields
• Maps data type variations`
                    },
                    {
                        title: 'Relationship Detection',
                        content: `MigrationMind automatically detects:
• ObjectId references between collections
• Embedded documents
• Array relationships
• Foreign key patterns
• Confidence scores for each relationship
• Relationship types (ONE_TO_ONE, ONE_TO_MANY, etc.)`
                    },
                    {
                        title: 'Risk Assessment',
                        content: `Identified risks include:
• Schema inconsistencies
• Data type conflicts
• Large array fields
• Missing indexes
• Complex nested structures
• Each risk includes severity level and mitigation strategies`
                    }
                ]
            }
        },
        {
            id: 'migration-plan',
            title: 'Migration Planning',
            icon: FileText,
            content: {
                title: 'Migration Plan Generation',
                description: 'How MigrationMind creates optimized migration plans.',
                subsections: [
                    {
                        title: 'Plan Components',
                        content: `A migration plan includes:
• Target PostgreSQL schema (DDL statements)
• Table creation order based on dependencies
• Index definitions
• Foreign key constraints
• Data type mappings
• Transformation rules for complex types`
                    },
                    {
                        title: 'Type Mapping',
                        content: `MongoDB to PostgreSQL type conversions:
• String → VARCHAR/TEXT
• Number → INTEGER/BIGINT/NUMERIC
• Boolean → BOOLEAN
• Date → TIMESTAMP
• ObjectId → VARCHAR(24) or UUID
• Array → JSONB or separate table
• Object → JSONB
• Binary → BYTEA`
                    },
                    {
                        title: 'Review Process',
                        content: `Before execution:
1. Review the generated SQL schema
2. Check table relationships
3. Verify data type mappings
4. Examine transformation rules
5. Approve or request modifications
6. Download the plan for records`
                    }
                ]
            }
        },
        {
            id: 'execution',
            title: 'Migration Execution',
            icon: Zap,
            content: {
                title: 'Executing Migrations',
                description: 'Run migrations with confidence using our multi-threaded engine.',
                subsections: [
                    {
                        title: 'Execution Modes',
                        content: `MigrationMind uses a producer-consumer pattern:
• Producer thread reads from MongoDB
• Multiple consumer threads write to PostgreSQL
• Configurable thread count (default: 5)
• Automatic load balancing
• Real-time progress tracking`
                    },
                    {
                        title: 'Batch Processing',
                        content: `Data is migrated in batches:
• Default batch size: 1000 records
• Configurable per migration
• Automatic retry on failure
• Transaction support for consistency
• Rollback on critical errors`
                    },
                    {
                        title: 'Progress Monitoring',
                        content: `Track your migration in real-time:
• Overall progress percentage
• Records processed vs total
• Current table being migrated
• Success/failure counts
• Estimated time remaining
• Error logs and warnings`
                    },
                    {
                        title: 'Error Handling',
                        content: `Robust error management:
• Automatic retry for transient errors
• Detailed error logging
• Partial migration support
• Resume from last checkpoint
• Rollback options
• Error notifications`
                    }
                ]
            }
        },
        {
            id: 'validation',
            title: 'Validation & Reports',
            icon: CheckCircle,
            content: {
                title: 'Post-Migration Validation',
                description: 'Ensure data integrity with comprehensive validation.',
                subsections: [
                    {
                        title: 'Validation Checks',
                        content: `Automatic validation includes:
• Row count comparison
• Data type verification
• Null value consistency
• Foreign key integrity
• Index creation verification
• Sample data comparison`
                    },
                    {
                        title: 'Audit Reports',
                        content: `Downloadable reports contain:
• Migration summary
• Source and target statistics
• Execution timeline
• Error logs
• Validation results
• Performance metrics
• Recommendations`
                    },
                    {
                        title: 'Data Verification',
                        content: `Manual verification steps:
1. Compare record counts
2. Spot-check critical data
3. Test application queries
4. Verify relationships
5. Check data types
6. Validate indexes`
                    }
                ]
            }
        },
        {
            id: 'security',
            title: 'Security',
            icon: Shield,
            content: {
                title: 'Security & Privacy',
                description: 'How we protect your data and credentials.',
                subsections: [
                    {
                        title: 'Authentication',
                        content: `Secure user authentication:
• Powered by Supabase Auth
• JWT token-based authentication
• Email verification
• Password reset functionality
• Session management
• Automatic token refresh`
                    },
                    {
                        title: 'Credential Handling',
                        content: `Database credentials are:
• Never stored permanently
• Used only during active sessions
• Encrypted in transit
• Not logged or cached
• Cleared after migration
• Never shared with third parties`
                    },
                    {
                        title: 'Data Privacy',
                        content: `Your data privacy:
• Data stays in your databases
• No data stored on our servers
• Direct database-to-database transfer
• Encrypted connections (SSL/TLS)
• Compliance with data protection regulations
• Optional on-premise deployment`
                    },
                    {
                        title: 'Best Practices',
                        content: `Security recommendations:
• Use read-only credentials for source
• Create dedicated migration user
• Limit network access
• Enable SSL/TLS connections
• Rotate credentials after migration
• Review audit logs
• Test in staging first`
                    }
                ]
            }
        },
        {
            id: 'api',
            title: 'API Reference',
            icon: Code,
            content: {
                title: 'API Documentation',
                description: 'Integrate MigrationMind into your workflows.',
                subsections: [
                    {
                        title: 'Authentication',
                        content: `All API requests require authentication:
• Include JWT token in Authorization header
• Format: "Bearer <your-token>"
• Obtain token from Supabase Auth
• Token expires after 1 hour
• Refresh using refresh token`
                    },
                    {
                        title: 'Key Endpoints',
                        content: `Main API endpoints:

**POST /api/mongo/connections/test**
Test MongoDB connection

**POST /api/mongo/analyze/{migrationId}**
Analyze MongoDB schema

**GET /api/mongo/schema/{migrationId}**
Get discovered schema

**GET /api/mongo/relationships/{migrationId}**
Get detected relationships

**POST /api/mongo/migration-plan/generate/{migrationId}**
Generate migration plan

**POST /api/migrations/{migrationId}/execute**
Execute migration

**GET /api/migrations/{migrationId}/status**
Get migration status`
                    },
                    {
                        title: 'Request Examples',
                        content: `Example: Test MongoDB Connection
\`\`\`bash
curl -X POST http://localhost:8080/api/mongo/connections/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "host": "localhost",
    "port": 27017,
    "databaseName": "mydb",
    "username": "user",
    "password": "pass"
  }'
\`\`\``
                    },
                    {
                        title: 'Response Formats',
                        content: `All responses are JSON:
• Success: { "success": true, "data": {...} }
• Error: { "success": false, "error": "message" }
• HTTP status codes follow REST conventions
• Detailed error messages for debugging`
                    }
                ]
            }
        },
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: AlertCircle,
            content: {
                title: 'Common Issues & Solutions',
                description: 'Resolve common problems quickly.',
                subsections: [
                    {
                        title: 'Connection Issues',
                        content: `**Cannot connect to MongoDB:**
• Verify host and port are correct
• Check firewall rules
• Ensure MongoDB is running
• Verify credentials
• Check network connectivity
• For Atlas, ensure IP is whitelisted

**Cannot connect to PostgreSQL:**
• Verify connection details
• Check PostgreSQL is running
• Verify user permissions
• Check pg_hba.conf settings
• Ensure database exists`
                    },
                    {
                        title: 'Migration Errors',
                        content: `**Migration fails to start:**
• Ensure analysis is complete
• Verify migration plan exists
• Check target database is empty
• Verify user has CREATE permissions

**Migration stops mid-way:**
• Check error logs
• Verify network stability
• Check disk space
• Review data type conflicts
• Increase timeout settings`
                    },
                    {
                        title: 'Performance Issues',
                        content: `**Slow migration:**
• Increase thread count
• Adjust batch size
• Check network latency
• Verify database resources
• Disable unnecessary indexes during migration
• Re-enable indexes after completion

**High memory usage:**
• Reduce batch size
• Decrease thread count
• Check for large documents
• Monitor system resources`
                    },
                    {
                        title: 'Data Issues',
                        content: `**Data type mismatches:**
• Review migration plan
• Check type mappings
• Verify source data quality
• Use JSONB for complex types
• Custom transformations may be needed

**Missing data:**
• Check error logs
• Verify source data exists
• Review filter conditions
• Check for null values
• Verify character encoding`
                    }
                ]
            }
        },
        {
            id: 'faq',
            title: 'FAQ',
            icon: Book,
            content: {
                title: 'Frequently Asked Questions',
                description: 'Quick answers to common questions.',
                subsections: [
                    {
                        title: 'General',
                        content: `**Q: Is my data safe?**
A: Yes. Data transfers directly between your databases. We never store your data.

**Q: Can I pause a migration?**
A: Currently, migrations run to completion. We recommend testing with small datasets first.

**Q: What databases are supported?**
A: Currently MongoDB (source) to PostgreSQL (target). More databases coming soon.

**Q: Is there a size limit?**
A: No hard limits. We've tested with databases up to 100GB successfully.`
                    },
                    {
                        title: 'Pricing & Limits',
                        content: `**Q: Is there a free tier?**
A: Yes! Free tier includes unlimited migrations with standard features.

**Q: What are the rate limits?**
A: Free tier: 10 migrations/month. Paid tiers have higher limits.

**Q: Can I migrate multiple databases?**
A: Yes, create separate migrations for each database.`
                    },
                    {
                        title: 'Technical',
                        content: `**Q: Do I need to install anything?**
A: No, MigrationMind is fully cloud-based. Just access via web browser.

**Q: Can I run migrations locally?**
A: Yes, the backend can be self-hosted. Contact us for details.

**Q: What about complex data types?**
A: Arrays and objects are mapped to JSONB. Custom mappings available.

**Q: Can I customize the migration plan?**
A: Currently, plans are auto-generated. Manual editing coming soon.`
                    }
                ]
            }
        }
    ];

    const currentSection = sections.find(s => s.id === activeSection);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-white hover:text-orange-500 transition-colors"
                        >
                            <Home className="h-5 w-5" />
                            <span className="font-semibold">Back to Home</span>
                        </button>
                    </div>
                    <h1 className="text-xl font-bold text-white">Documentation</h1>
                    <div className="w-32" /> {/* Spacer for centering */}
                </div>
            </nav>

            <div className="pt-16 flex">
                {/* Sidebar */}
                <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Contents
                        </h2>
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${activeSection === section.id
                                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <section.icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm font-medium">{section.title}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 p-6 lg:p-12">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    {currentSection && <currentSection.icon className="h-8 w-8 text-orange-500" />}
                                    <h1 className="text-4xl font-bold text-white">
                                        {currentSection?.content.title}
                                    </h1>
                                </div>
                                <p className="text-lg text-slate-400">
                                    {currentSection?.content.description}
                                </p>
                            </div>

                            {/* Content */}
                            <div className="space-y-8">
                                {currentSection?.content.subsections.map((subsection, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="bg-[#0a0a0a] rounded-xl border border-white/5 p-6"
                                    >
                                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <ChevronRight className="h-5 w-5 text-orange-500" />
                                            {subsection.title}
                                        </h2>
                                        <div className="prose prose-invert prose-slate max-w-none">
                                            <pre className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                                                {subsection.content}
                                            </pre>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Navigation */}
                            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                                        if (currentIndex > 0) {
                                            setActiveSection(sections[currentIndex - 1].id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={sections.findIndex(s => s.id === activeSection) === 0}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowRight className="h-4 w-4 rotate-180" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => {
                                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                                        if (currentIndex < sections.length - 1) {
                                            setActiveSection(sections[currentIndex + 1].id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={sections.findIndex(s => s.id === activeSection) === sections.length - 1}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Quick Links */}
                            <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Ready to get started?</h3>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] font-bold transition-all"
                                    >
                                        Create Account
                                    </button>
                                    <button
                                        onClick={() => navigate('/mongo-analysis')}
                                        className="px-6 py-3 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 font-semibold transition-all"
                                    >
                                        Start Migration
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Documentation;
