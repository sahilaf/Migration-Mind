import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Database, Activity, AlertTriangle, FileText, CheckCircle2, XCircle, Loader2, RefreshCw, Clock, Play, Settings, LogOut, Menu, X, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MigrationExecution } from '../components/MigrationExecution';
import { motion } from 'framer-motion';

interface DbConnection {
    host: string;
    port: number;
    databaseName: string;
    username?: string;
    password?: string;
    connectionString?: string;
    authDatabase?: string;
    engine: string;
    type: string;
}

interface AnalysisResult {
    success: boolean;
    message: string;
    schemaId?: string;
    collections?: string[];
    collectionFieldCounts?: Record<string, number>;
    relationshipCount?: number;
    riskCount?: number;
    error?: string;
}

interface MongoSchemaField {
    id: string;
    collectionName: string;
    fieldName: string;
    fieldPath: string;
    dataTypes: string[];
    frequency: number;
    isRequired: boolean;
    isArray: boolean;
}

interface MongoRelationship {
    id: string;
    sourceCollection: string;
    sourceField: string;
    targetCollection: string;
    relationType: string;
    confidence: number;
    detectionMethod: string;
}

interface MigrationRisk {
    id: string;
    riskType: string;
    severity: string;
    description: string;
    affectedCollections: string[];
    mitigation: string;
}


export default function MongoAnalysis() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('connection');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [connection, setConnection] = useState<DbConnection>({
        host: 'localhost',
        port: 27017,
        databaseName: '',
        engine: 'mongodb',
        type: 'SOURCE'
    });

    const [testing, setTesting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [schemas, setSchemas] = useState<Record<string, MongoSchemaField[]>>({});
    const [relationships, setRelationships] = useState<MongoRelationship[]>([]);
    const [risks, setRisks] = useState<MigrationRisk[]>([]);
    const [migrationPlan, setMigrationPlan] = useState<any>(null);
    const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    // State for existing analysis
    const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
    const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
    const [loadingExisting, setLoadingExisting] = useState(false);

    // Load connection info from URL params (coming from dashboard)
    useEffect(() => {
        const migrationId = searchParams.get('migrationId');
        const host = searchParams.get('host');
        const port = searchParams.get('port');
        const database = searchParams.get('database');
        const autoLoad = searchParams.get('autoLoad');

        if (migrationId) {
            setCurrentMigrationId(migrationId);
        }

        if (host && database) {
            setConnection(prev => ({
                ...prev,
                host: host,
                port: port ? parseInt(port) : 27017,
                databaseName: database
            }));

            // If autoLoad is true and we have a migrationId, load the existing analysis
            if (autoLoad === 'true' && migrationId) {
                const tab = searchParams.get('tab');
                loadExistingAnalysis(migrationId, tab);
            }
        }
    }, [searchParams]);

    const loadExistingAnalysis = async (migrationId: string, initialTab?: string | null) => {
        setLoadingExisting(true);
        try {
            // Load all analysis data
            await Promise.all([
                loadSchemas(migrationId),
                loadRelationships(migrationId),
                loadRisks(migrationId),
                loadMigrationPlan(migrationId)
            ]);

            setHasExistingAnalysis(true);
            // Set the active tab based on URL param or default to 'schema'
            setActiveTab(initialTab || 'schema');
            setTestResult({ success: true, message: 'Analysis loaded from saved data' });
        } catch (error) {
            console.error('Failed to load existing analysis:', error);
        } finally {
            setLoadingExisting(false);
        }
    };

    const getOrCreateMigration = async (): Promise<string | null> => {
        if (!user) {
            alert('Please log in to analyze databases');
            return null;
        }

        try {
            const response = await fetch('http://localhost:8080/api/mongo/get-or-create-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    host: connection.host,
                    port: connection.port,
                    databaseName: connection.databaseName
                })
            });

            const data = await response.json();

            if (data.migrationId) {
                setCurrentMigrationId(data.migrationId);

                if (data.isExisting && data.hasAnalysis) {
                    setHasExistingAnalysis(true);
                    if (data.lastAnalyzedAt) {
                        setLastAnalyzedAt(data.lastAnalyzedAt);
                    }
                }

                return data.migrationId;
            }

            return null;
        } catch (error) {
            console.error('Failed to get/create migration:', error);
            return null;
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        setHasExistingAnalysis(false);
        setLastAnalyzedAt(null);

        try {
            const response = await fetch('http://localhost:8080/api/mongo/connections/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(connection)
            });

            const data = await response.json();
            setTestResult(data);

            if (data.success) {
                // After successful connection test, get or create migration
                const migrationId = await getOrCreateMigration();

                if (migrationId && hasExistingAnalysis) {
                    // Load existing analysis data
                    await loadExistingAnalysis(migrationId);
                }

                alert(`✅ Connected! Found ${data.collectionCount} collections`);
            }
        } catch (error) {
            setTestResult({ success: false, error: String(error) });
        } finally {
            setTesting(false);
        }
    };

    const runAnalysis = async () => {
        if (!currentMigrationId) {
            alert('Please test the connection first');
            return;
        }

        setAnalyzing(true);
        setAnalysisResult(null);

        try {
            const response = await fetch(
                `http://localhost:8080/api/mongo/analyze/${currentMigrationId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dbConnection: connection,
                        sampleSize: 1000,
                        includeAI: false
                    })
                }
            );

            const data = await response.json();
            setAnalysisResult(data);

            if (data.success) {
                setHasExistingAnalysis(true);
                setLastAnalyzedAt(new Date().toISOString());
                alert('✅ Analysis completed! Check the tabs for results.');
                setActiveTab('schema');
                loadSchemas(currentMigrationId);
                loadRelationships(currentMigrationId);
                loadRisks(currentMigrationId);
                loadMigrationPlan(currentMigrationId);
            }
        } catch (error) {
            setAnalysisResult({ success: false, message: 'Failed', error: String(error) });
        } finally {
            setAnalyzing(false);
        }
    };

    const loadSchemas = async (migrationId?: string) => {
        const id = migrationId || currentMigrationId;
        if (!id) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/mongo/schema/${id}`
            );
            const data = await response.json();
            if (!data.error) {
                setSchemas(data.collections || {});
            }
        } catch (error) {
            console.error('Failed to load schemas:', error);
        }
    };

    const loadRelationships = async (migrationId?: string) => {
        const id = migrationId || currentMigrationId;
        if (!id) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/mongo/relationships/${id}`
            );
            const data = await response.json();
            if (!data.error) {
                setRelationships(data.relationships || []);
            }
        } catch (error) {
            console.error('Failed to load relationships:', error);
        }
    };

    const loadRisks = async (migrationId?: string) => {
        const id = migrationId || currentMigrationId;
        if (!id) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/mongo/risks/${id}`
            );
            const data = await response.json();
            if (!data.error) {
                setRisks(data.risks || []);
            }
        } catch (error) {
            console.error('Failed to load risks:', error);
        }
    };

    const loadMigrationPlan = async (migrationId?: string) => {
        const id = migrationId || currentMigrationId;
        if (!id) return;

        try {
            const response = await fetch(
                `http://localhost:8080/api/mongo/migration-plan/${id}`
            );
            const data = await response.json();
            if (!data.error) {
                setMigrationPlan(data.planJson || data);
            }
        } catch (error) {
            console.error('Failed to load migration plan:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-300 border-red-500/30';
            case 'HIGH': return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
            case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
            case 'LOW': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
            default: return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300">
            {/* Navigation */}
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl"
            >
                <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl font-bold text-white">Migration Mind</span>
                    </a>

                    {/* Desktop Navigation Links */}
                    <div className="hidden items-center gap-8 lg:flex">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm text-slate-300 transition-colors hover:text-orange-500"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/mongo-analysis')}
                            className="text-sm text-orange-500 font-medium"
                        >
                            MongoDB Analysis
                        </button>
                    </div>

                    {/* Desktop User Menu */}
                    <div className="hidden items-center gap-4 lg:flex">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    <span className="text-sm">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </span>
                                </button>
                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg"
                                    >
                                        <div className="p-3 border-b border-white/10">
                                            <p className="text-sm font-medium truncate text-white">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigate('/dashboard');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                        >
                                            <HomeIcon className="h-4 w-4" />
                                            Dashboard
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/mongo-analysis');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
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
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/10"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="rounded-lg p-2 text-white lg:hidden"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl lg:hidden"
                    >
                        <div className="container mx-auto flex flex-col gap-4 px-4 py-6">
                            <button
                                onClick={() => {
                                    navigate('/dashboard');
                                    setMobileMenuOpen(false);
                                }}
                                className="text-left text-sm text-slate-300 transition-colors hover:text-orange-500"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    navigate('/mongo-analysis');
                                    setMobileMenuOpen(false);
                                }}
                                className="text-left text-sm text-orange-500 font-medium"
                            >
                                MongoDB Analysis
                            </button>
                            {user && (
                                <>
                                    <div className="border-t border-white/10 pt-4 mt-2">
                                        <p className="text-xs text-slate-500 mb-2">Signed in as</p>
                                        <p className="text-sm text-white truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await signOut();
                                            setMobileMenuOpen(false);
                                            navigate('/');
                                        }}
                                        className="flex items-center gap-2 text-left text-sm text-red-400 transition-colors hover:text-red-300"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.header>
            <div className="pt-20 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            MongoDB Analysis
                        </h1>
                        <p className="text-slate-400">
                            Discover schemas, detect relationships, and generate migration plans with AI-powered analysis
                        </p>
                    </div>

                    {/* Loading existing analysis indicator */}
                    {loadingExisting && (
                        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                            <span className="text-blue-300">Loading saved analysis data...</span>
                        </div>
                    )}

                    {/* Existing analysis banner */}
                    {hasExistingAnalysis && lastAnalyzedAt && !loadingExisting && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <div>
                                    <span className="text-green-300 font-medium">Analysis data loaded from database</span>
                                    <div className="flex items-center gap-2 text-sm text-green-400/70 mt-0.5">
                                        <Clock className="w-4 h-4" />
                                        Last analyzed: {formatDate(lastAnalyzedAt)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={runAnalysis}
                                disabled={analyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30"
                            >
                                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                                Re-analyze
                            </button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/5 mb-6">
                        <div className="flex border-b border-white/5">
                            {[
                                { id: 'connection', label: 'Connection', icon: Database },
                                { id: 'schema', label: 'Schema', icon: FileText },
                                { id: 'relationships', label: 'Relationships', icon: Activity },
                                { id: 'risks', label: 'Risks', icon: AlertTriangle },
                                { id: 'plan', label: 'Migration Plan', icon: CheckCircle2 },
                                { id: 'execution', label: 'Execution', icon: Play }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${activeTab === tab.id
                                        ? 'border-b-2 border-orange-600 text-orange-500'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* Connection Tab */}
                            {activeTab === 'connection' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Host
                                            </label>
                                            <input
                                                type="text"
                                                value={connection.host}
                                                onChange={(e) => setConnection({ ...connection, host: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="localhost"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Port
                                            </label>
                                            <input
                                                type="number"
                                                value={connection.port}
                                                onChange={(e) => setConnection({ ...connection, port: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="27017"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Database Name
                                            </label>
                                            <input
                                                type="text"
                                                value={connection.databaseName}
                                                onChange={(e) => setConnection({ ...connection, databaseName: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="myDatabase"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Username (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={connection.username || ''}
                                                onChange={(e) => setConnection({ ...connection, username: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Password (Optional)
                                            </label>
                                            <input
                                                type="password"
                                                value={connection.password || ''}
                                                onChange={(e) => setConnection({ ...connection, password: e.target.value })}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Connection String Alternative */}
                                    <div className="border-t border-white/5 pt-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex-1 border-t border-white/10"></div>
                                            <span className="text-sm text-slate-400 font-medium">OR</span>
                                            <div className="flex-1 border-t border-white/10"></div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Connection String (MongoDB Atlas)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database"
                                                onChange={(e) => {
                                                    const connectionString = e.target.value.trim();
                                                    if (connectionString) {
                                                        try {
                                                            // Parse the connection string
                                                            const withoutProtocol = connectionString.replace(/^mongodb(\+srv)?:\/\//, '');
                                                            const isSrv = connectionString.startsWith('mongodb+srv://');

                                                            // Extract credentials if present
                                                            let credentials = { username: '', password: '' };
                                                            let hostPart = withoutProtocol;

                                                            if (withoutProtocol.includes('@')) {
                                                                const atIndex = withoutProtocol.lastIndexOf('@');
                                                                const credPart = withoutProtocol.substring(0, atIndex);
                                                                hostPart = withoutProtocol.substring(atIndex + 1);

                                                                if (credPart.includes(':')) {
                                                                    const [user, pass] = credPart.split(':');
                                                                    credentials = { username: decodeURIComponent(user), password: decodeURIComponent(pass) };
                                                                }
                                                            }

                                                            // Extract host, database, and other params
                                                            const hostAndParams = hostPart.split('/');
                                                            const host = hostAndParams[0].split('?')[0];
                                                            const database = hostAndParams[1]?.split('?')[0] || '';

                                                            setConnection({
                                                                ...connection,
                                                                host: host,
                                                                port: isSrv ? 27017 : parseInt('27017'),
                                                                databaseName: database,
                                                                username: credentials.username || connection.username,
                                                                password: credentials.password || connection.password,
                                                                connectionString: connectionString
                                                            });
                                                        } catch (error) {
                                                            console.error('Failed to parse connection string:', error);
                                                        }
                                                    }
                                                }}
                                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-2">
                                                Paste your MongoDB Atlas connection string to auto-fill host, port, credentials, and database name
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={testConnection}
                                            disabled={testing}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {testing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Testing...
                                                </>
                                            ) : (
                                                <>
                                                    <Database className="w-5 h-5" />
                                                    Test Connection
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={runAnalysis}
                                            disabled={analyzing || !testResult?.success || !currentMigrationId}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Activity className="w-5 h-5" />
                                                    {hasExistingAnalysis ? 'Re-analyze' : 'Run Analysis'}
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {testResult && (
                                        <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                            <div className="flex items-center gap-2">
                                                {testResult.success ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                )}
                                                <span className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                                                    {testResult.success ? testResult.message : testResult.error}
                                                </span>
                                            </div>
                                            {testResult.collections && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-slate-400">Collections found:</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {testResult.collections.map((col: string) => (
                                                            <span key={col} className="px-2 py-1 bg-white/10 rounded text-sm text-slate-300">
                                                                {col}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {hasExistingAnalysis && (
                                                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <div className="flex items-center gap-2 text-blue-300">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="font-medium">Previous analysis found!</span>
                                                    </div>
                                                    {lastAnalyzedAt && (
                                                        <p className="text-sm text-blue-400/70 mt-1">
                                                            Last analyzed: {formatDate(lastAnalyzedAt)}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-blue-400/70 mt-1">
                                                        Click the tabs above to view the saved analysis, or click "Re-analyze" to update it.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {analysisResult && (
                                        <div className={`p-4 rounded-lg border ${analysisResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                            <div className="flex items-center gap-2">
                                                {analysisResult.success ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                )}
                                                <span className={analysisResult.success ? 'text-green-300 font-medium' : 'text-red-300'}>
                                                    {analysisResult.message}
                                                </span>
                                            </div>
                                            {analysisResult.success && (
                                                <div className="mt-3 grid grid-cols-3 gap-4">
                                                    <div className="bg-white/5 p-3 rounded border border-white/10">
                                                        <p className="text-sm text-slate-400">Collections</p>
                                                        <p className="text-2xl font-bold text-orange-500">
                                                            {analysisResult.collections?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded border border-white/10">
                                                        <p className="text-sm text-slate-400">Relationships</p>
                                                        <p className="text-2xl font-bold text-orange-400">
                                                            {analysisResult.relationshipCount || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded border border-white/10">
                                                        <p className="text-sm text-slate-400">Risks</p>
                                                        <p className="text-2xl font-bold text-amber-500">
                                                            {analysisResult.riskCount || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Schema Tab */}
                            {activeTab === 'schema' && (
                                <div className="space-y-4">
                                    {Object.keys(schemas).length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p>No schema data available. Run analysis first.</p>
                                        </div>
                                    ) : (
                                        Object.entries(schemas).map(([collectionName, fields]) => (
                                            <div key={collectionName} className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                                                <div className="bg-orange-500/10 px-4 py-3 border-b border-white/10">
                                                    <h3 className="font-semibold text-orange-400">
                                                        {collectionName} ({fields.length} fields)
                                                    </h3>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-black/20">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-sm font-medium text-slate-400">Field</th>
                                                                <th className="px-4 py-2 text-left text-sm font-medium text-slate-400">Types</th>
                                                                <th className="px-4 py-2 text-left text-sm font-medium text-slate-400">Frequency</th>
                                                                <th className="px-4 py-2 text-left text-sm font-medium text-slate-400">Flags</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {fields.map((field) => (
                                                                <tr key={field.id} className="hover:bg-white/5">
                                                                    <td className="px-4 py-3 font-mono text-sm text-slate-300">{field.fieldName}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {field.dataTypes.map((type, idx) => (
                                                                                <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                                                                                    {type}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex-1 bg-white/10 rounded-full h-2">
                                                                                <div
                                                                                    className="bg-orange-600 h-2 rounded-full"
                                                                                    style={{ width: `${field.frequency * 100}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-sm text-slate-400">{(field.frequency * 100).toFixed(0)}%</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex gap-1">
                                                                            {field.isRequired && (
                                                                                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">Required</span>
                                                                            )}
                                                                            {field.isArray && (
                                                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">Array</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Relationships Tab */}
                            {activeTab === 'relationships' && (
                                <div className="space-y-4">
                                    {relationships.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p>No relationships detected. Run analysis first.</p>
                                        </div>
                                    ) : (
                                        relationships.map((rel) => (
                                            <div key={rel.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-all bg-white/5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-semibold text-orange-400">{rel.sourceCollection}</span>
                                                            <span className="text-slate-500">.</span>
                                                            <span className="font-mono text-slate-300">{rel.sourceField}</span>
                                                        </div>
                                                        <span className="text-slate-500">→</span>
                                                        <span className="font-mono font-semibold text-orange-500">{rel.targetCollection}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-sm border ${rel.confidence >= 0.8 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                            rel.confidence >= 0.6 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                                'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                                            }`}>
                                                            {(rel.confidence * 100).toFixed(0)}% confidence
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 text-sm text-slate-400">
                                                    <span className="px-2 py-1 bg-white/10 rounded border border-white/10">{rel.relationType}</span>
                                                    <span className="px-2 py-1 bg-white/10 rounded border border-white/10">{rel.detectionMethod}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Risks Tab */}
                            {activeTab === 'risks' && (
                                <div className="space-y-4">
                                    {risks.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
                                            <p>No risks detected! Your migration looks good.</p>
                                        </div>
                                    ) : (
                                        risks.map((risk) => (
                                            <div key={risk.id} className={`border-2 rounded-lg p-4 ${getSeverityColor(risk.severity)}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle className="w-6 h-6" />
                                                        <div>
                                                            <h4 className="font-semibold">{risk.riskType.replace(/_/g, ' ')}</h4>
                                                            <p className="text-sm mt-1">{risk.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium">
                                                        {risk.severity}
                                                    </span>
                                                </div>
                                                <div className="mt-3 p-3 bg-black/20 rounded">
                                                    <p className="text-sm font-medium mb-1">Mitigation:</p>
                                                    <p className="text-sm">{risk.mitigation}</p>
                                                </div>
                                                {risk.affectedCollections && risk.affectedCollections.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {risk.affectedCollections.map((col, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                                                                {col}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Migration Plan Tab */}
                            {activeTab === 'plan' && (
                                <div className="space-y-6">
                                    {/* No migration plan - show generate button or message */}
                                    {(!migrationPlan || migrationPlan.error || Object.keys(migrationPlan).length === 0) ? (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-50" />

                                            {/* If we have schema data, show generate button */}
                                            {Object.keys(schemas).length > 0 && currentMigrationId ? (
                                                <>
                                                    <p className="mb-2 text-lg text-slate-300 font-medium">No migration plan yet</p>
                                                    <p className="mb-6 text-slate-500">
                                                        Schema analysis is complete. Generate a migration plan to see table mappings, foreign keys, and recommended indexes.
                                                    </p>
                                                    <button
                                                        onClick={async () => {
                                                            if (!currentMigrationId) return;
                                                            setGeneratingPlan(true);
                                                            try {
                                                                const response = await fetch(
                                                                    `http://localhost:8080/api/mongo/migration-plan/generate/${currentMigrationId}`,
                                                                    { method: 'POST' }
                                                                );
                                                                const data = await response.json();

                                                                if (response.ok) {
                                                                    setMigrationPlan(data);
                                                                    alert('✅ Migration plan generated successfully!');
                                                                } else {
                                                                    alert(`❌ Failed: ${data.error}`);
                                                                }
                                                            } catch (error) {
                                                                console.error('Failed to generate plan:', error);
                                                                alert('❌ Failed to generate migration plan');
                                                            } finally {
                                                                setGeneratingPlan(false);
                                                            }
                                                        }}
                                                        disabled={generatingPlan}
                                                        className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center gap-3 mx-auto"
                                                    >
                                                        {generatingPlan ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                Generating Migration Plan...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileText className="w-5 h-5" />
                                                                Generate Migration Plan
                                                            </>
                                                        )}
                                                    </button>
                                                    <p className="text-xs text-slate-600 mt-4">
                                                        This will create table mappings, foreign key constraints, and index recommendations based on your schema.
                                                    </p>
                                                </>
                                            ) : (
                                                /* No schema data - need to run analysis first */
                                                <>
                                                    <p className="mb-2 text-lg text-slate-400">No migration plan available</p>
                                                    <p className="text-slate-500">
                                                        Run the database analysis first to discover your schema, then generate a migration plan.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    ) : (() => {
                                        // Extract planJson if nested
                                        const plan = migrationPlan.planJson || migrationPlan;

                                        return (
                                            <>
                                                {/* Table Mappings */}
                                                {plan.tableMappings && plan.tableMappings.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-4 text-white">Table Mappings</h3>
                                                        <div className="space-y-4">
                                                            {plan.tableMappings.map((mapping: any, idx: number) => (
                                                                <div key={idx} className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                                                                    <div className="bg-orange-500/10 px-4 py-3 border-b border-white/10">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="font-semibold text-orange-400">
                                                                                {mapping.sourceCollection} → {mapping.targetTable}
                                                                            </h4>
                                                                            <span className="text-xs text-slate-400">
                                                                                {mapping.columns?.length || 0} columns
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-4">
                                                                        <table className="w-full text-sm">
                                                                            <thead>
                                                                                <tr className="border-b border-white/5">
                                                                                    <th className="text-left py-2 text-slate-400 font-medium">Source Field</th>
                                                                                    <th className="text-left py-2 text-slate-400 font-medium">Target Column</th>
                                                                                    <th className="text-left py-2 text-slate-400 font-medium">Type</th>
                                                                                    <th className="text-left py-2 text-slate-400 font-medium">Flags</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-white/5">
                                                                                {mapping.columns?.map((col: any, colIdx: number) => (
                                                                                    <tr key={colIdx} className="hover:bg-white/5">
                                                                                        <td className="py-2 font-mono text-slate-300">{col.sourceField}</td>
                                                                                        <td className="py-2 font-mono text-slate-300">{col.targetColumn}</td>
                                                                                        <td className="py-2">
                                                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                                                                                                {col.dataType}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2">
                                                                                            <div className="flex gap-1 flex-wrap">
                                                                                                {col.primaryKey && (
                                                                                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">PK</span>
                                                                                                )}
                                                                                                {!col.nullable && (
                                                                                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">NOT NULL</span>
                                                                                                )}
                                                                                                {col.requiresTransformation && (
                                                                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs border border-amber-500/30">{col.transformationType}</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Migration Steps */}
                                                {plan.migrationSteps && plan.migrationSteps.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-4 text-white">Migration Steps</h3>
                                                        <div className="space-y-3">
                                                            {plan.migrationSteps.map((step: any, idx: number) => (
                                                                <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                                                        {step.step}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-slate-200">{step.description}</p>
                                                                        {step.note && <p className="text-sm text-slate-400 mt-1">{step.note}</p>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Foreign Keys */}
                                                {plan.foreignKeys && plan.foreignKeys.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-4 text-white">Foreign Keys ({plan.foreignKeys.length})</h3>
                                                        <div className="space-y-2">
                                                            {plan.foreignKeys.map((fk: any, idx: number) => (
                                                                <div key={idx} className="p-3 border border-white/10 rounded-lg bg-white/5 flex items-center justify-between">
                                                                    <code className="text-sm text-slate-300">
                                                                        {fk.sourceTable}.{fk.sourceColumn} → {fk.targetTable}.{fk.targetColumn}
                                                                    </code>
                                                                    {fk.confidence && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {(fk.confidence * 100).toFixed(0)}% confidence
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Indexes */}
                                                {plan.indexes && plan.indexes.length > 0 && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-4 text-white">Recommended Indexes ({plan.indexes.length})</h3>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {plan.indexes.map((idx: any, i: number) => (
                                                                <div key={i} className="p-3 border border-white/10 rounded-lg bg-white/5">
                                                                    <p className="font-mono text-sm font-medium text-orange-400">{idx.indexName}</p>
                                                                    <p className="text-xs text-slate-400 mt-1">{idx.reason}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fallback: Show raw data if no expected structure */}
                                                {!plan.tableMappings && !plan.migrationSteps && !plan.foreignKeys && !plan.indexes && (
                                                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                                        <h3 className="text-lg font-semibold mb-4 text-white">Migration Plan Data</h3>
                                                        <div className="bg-black/40 rounded p-4 overflow-auto max-h-96">
                                                            <pre className="text-xs text-slate-300 font-mono">
                                                                {JSON.stringify(migrationPlan, null, 2)}
                                                            </pre>
                                                        </div>
                                                        <p className="text-sm text-slate-400 mt-3">
                                                            The migration plan was generated but doesn't contain the expected structure (migrationSteps, foreignKeys, indexes).
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                            {/* Execution Tab */}
                            {activeTab === 'execution' && (
                                <MigrationExecution
                                    migrationId={currentMigrationId || ''}
                                    migrationPlan={migrationPlan}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
