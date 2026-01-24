import { useState, useEffect } from 'react';
import { Play, Loader2, CheckCircle2, AlertTriangle, Database, Zap } from 'lucide-react';

interface MigrationProgress {
    id: string;
    runId: string;
    tableName: string;
    rowsTotal: number;
    rowsProcessed: number;
    status: string;
    updatedAt: string;
}

interface MigrationExecutionProps {
    migrationId: string;
}

export function MigrationExecution({ migrationId }: MigrationExecutionProps) {
    const [executing, setExecuting] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [progress, setProgress] = useState<MigrationProgress[]>([]);
    const [overallStatus, setOverallStatus] = useState<string>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [showCredentialsForm, setShowCredentialsForm] = useState(true);

    // Target database credentials
    const [targetHost, setTargetHost] = useState('');
    const [targetPort, setTargetPort] = useState('5432');
    const [targetDatabase, setTargetDatabase] = useState('postgres');
    const [targetUsername, setTargetUsername] = useState('');
    const [targetPassword, setTargetPassword] = useState('');

    // Poll for progress
    useEffect(() => {
        let interval: any;

        if (runId && (overallStatus === 'RUNNING' || overallStatus === 'IDLE')) { // IDLE here means we just started
            interval = setInterval(fetchProgress, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [runId, overallStatus]);

    // Check if credentials are already saved
    useEffect(() => {
        const checkCredentials = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/migrations/${migrationId}`);
                const data = await response.json();

                if (data.hasTargetCredentials) {
                    setTargetHost(data.targetHost || '');
                    setTargetPort(data.targetPort?.toString() || '5432');
                    setTargetDatabase(data.targetDatabase || 'postgres');
                    setShowCredentialsForm(false);
                }
            } catch (err) {
                console.error('Failed to check credentials:', err);
            }
        };

        if (migrationId && !runId) {
            checkCredentials();
        }
    }, [migrationId]);

    const saveTargetCredentials = async () => {
        if (!targetHost || !targetPort || !targetDatabase || !targetUsername || !targetPassword) {
            setError('Please fill in all target database fields');
            return;
        }

        setExecuting(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8080/api/migrations/${migrationId}/target-credentials`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetHost,
                    targetPort: parseInt(targetPort),
                    targetDatabase,
                    targetUsername,
                    targetPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setShowCredentialsForm(false);
            } else {
                setError(data.error || 'Failed to save target credentials');
            }
        } catch (err) {
            setError('Network error saving credentials');
        } finally {
            setExecuting(false);
        }
    };

    const startMigration = async () => {
        if (!migrationId) return;

        setExecuting(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8080/api/migrations/${migrationId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                setRunId(data.runId);
                setOverallStatus('RUNNING');
            } else {
                setError(data.error || 'Failed to start migration');
                setExecuting(false);
            }
        } catch (err) {
            setError('Network error starting migration');
            setExecuting(false);
        }
    };

    const fetchProgress = async () => {
        if (!runId) return;

        try {
            const response = await fetch(`http://localhost:8080/api/migrations/run/${runId}/progress`);
            const data = await response.json();

            if (Array.isArray(data)) {
                setProgress(data);

                // Check if all completed
                const allDone = data.every(p => p.status === 'COMPLETED' || p.status === 'FAILED');
                if (allDone && data.length > 0) {
                    setOverallStatus('COMPLETED');
                    setExecuting(false);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const calculatePercentage = (processed: number, total: number) => {
        if (!total || total === 0) return 0;
        return Math.min(100, Math.round((processed / total) * 100));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-400';
            case 'FAILED': return 'text-red-400';
            case 'RUNNING': return 'text-orange-400 animate-pulse';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Target Database Credentials Form */}
            {showCredentialsForm && !runId && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                    <div className="max-w-2xl mx-auto">
                        <Database className="w-16 h-16 mx-auto mb-6 text-orange-500" />
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Configure Target Database</h2>
                        <p className="text-slate-400 mb-8 text-center">
                            Enter your PostgreSQL/Supabase credentials where the data will be migrated to.
                        </p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Host
                                    </label>
                                    <input
                                        type="text"
                                        value={targetHost}
                                        onChange={(e) => setTargetHost(e.target.value)}
                                        placeholder="e.g., aws-1-ap-south-1.pooler.supabase.com"
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        value={targetPort}
                                        onChange={(e) => setTargetPort(e.target.value)}
                                        placeholder="5432"
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Database Name
                                </label>
                                <input
                                    type="text"
                                    value={targetDatabase}
                                    onChange={(e) => setTargetDatabase(e.target.value)}
                                    placeholder="postgres"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={targetUsername}
                                    onChange={(e) => setTargetUsername(e.target.value)}
                                    placeholder="postgres.xxxxx"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={targetPassword}
                                    onChange={(e) => setTargetPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <button
                                onClick={saveTargetCredentials}
                                disabled={executing}
                                className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold text-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all disabled:opacity-50"
                            >
                                {executing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save & Continue'
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-300">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ready to Migrate Screen */}
            {!showCredentialsForm && !runId && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-500" />
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to Migrate</h2>
                        <p className="text-slate-400 mb-4">
                            Target database configured successfully. This will migrate data from your MongoDB collection to PostgreSQL using high-performance parallel processing.
                        </p>

                        <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-6 text-left">
                            <div className="text-xs text-slate-500 mb-2">Target Database</div>
                            <div className="font-mono text-sm text-white">
                                {targetHost}:{targetPort}/{targetDatabase}
                            </div>
                        </div>

                        {/* Migration Info */}
                        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4 mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className="w-6 h-6 text-orange-400" />
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-white">Producer-Consumer Mode</div>
                                    <div className="text-xs text-slate-400">Multi-threaded parallel processing</div>
                                </div>
                                <span className="ml-auto px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-semibold">
                                    ⚡ High Performance
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                                <div className="flex items-center gap-1">
                                    <span className="text-orange-400 font-semibold">~6,500 docs/sec</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-green-400">8x faster</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startMigration}
                            disabled={executing}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold text-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all disabled:opacity-50"
                        >
                            {executing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6" />
                                    Start Migration
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setShowCredentialsForm(true)}
                            className="mt-4 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            Change target database
                        </button>

                        {error && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-300 text-left">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {runId && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {overallStatus === 'RUNNING' && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
                            {overallStatus === 'COMPLETED' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            Migration Progress
                        </h3>
                        <div className="text-slate-400 font-mono text-sm">
                            Run ID: {runId}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {progress.map((p) => (
                            <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`p-2 rounded bg-white/5 ${getStatusColor(p.status)}`}>
                                            <Database className="w-4 h-4" />
                                        </span>
                                        <div>
                                            <h4 className="font-medium text-white">{p.tableName}</h4>
                                            <p className="text-xs text-slate-500">Target Table</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${getStatusColor(p.status)}`}>
                                            {p.status}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">
                                            {p.rowsProcessed.toLocaleString()} / {p.rowsTotal.toLocaleString()} rows
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${p.status === 'FAILED' ? 'bg-red-500' :
                                            p.status === 'COMPLETED' ? 'bg-green-500' : 'bg-orange-500'
                                            }`}
                                        style={{ width: `${calculatePercentage(p.rowsProcessed, p.rowsTotal)}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        {progress.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                                <p>Initializing workers...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
