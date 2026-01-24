package com.sahil.backend.model;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe metrics tracking for migration progress
 * Tracks production, consumption, errors, and throughput
 */
public class MigrationMetrics {

    private final AtomicLong documentsProduced = new AtomicLong(0);
    private final AtomicLong documentsConsumed = new AtomicLong(0);
    private final AtomicLong errors = new AtomicLong(0);
    private final long startTime;
    private final String tableName;

    public MigrationMetrics(String tableName) {
        this.tableName = tableName;
        this.startTime = System.currentTimeMillis();
    }

    // Increment methods

    public void incrementProduced(long count) {
        documentsProduced.addAndGet(count);
    }

    public void incrementConsumed(long count) {
        documentsConsumed.addAndGet(count);
    }

    public void incrementErrors() {
        errors.incrementAndGet();
    }

    // Getter methods

    public long getDocumentsProduced() {
        return documentsProduced.get();
    }

    public long getDocumentsConsumed() {
        return documentsConsumed.get();
    }

    public long getErrors() {
        return errors.get();
    }

    public String getTableName() {
        return tableName;
    }

    // Calculated metrics

    public long getElapsedTimeMs() {
        return System.currentTimeMillis() - startTime;
    }

    public long getElapsedTimeSec() {
        return getElapsedTimeMs() / 1000;
    }

    public double getThroughputPerSecond() {
        long elapsed = getElapsedTimeSec();
        if (elapsed == 0)
            return 0;
        return (double) documentsConsumed.get() / elapsed;
    }

    public long getQueueBacklog() {
        return documentsProduced.get() - documentsConsumed.get();
    }

    public double getProgressPercentage(long totalDocuments) {
        if (totalDocuments == 0)
            return 0;
        return (double) documentsConsumed.get() / totalDocuments * 100;
    }

    public long getEstimatedTimeRemainingSec(long totalDocuments) {
        double throughput = getThroughputPerSecond();
        if (throughput == 0)
            return -1;

        long remaining = totalDocuments - documentsConsumed.get();
        return (long) (remaining / throughput);
    }

    @Override
    public String toString() {
        return String.format(
                "MigrationMetrics[table=%s, produced=%d, consumed=%d, errors=%d, throughput=%.2f docs/sec, elapsed=%d sec]",
                tableName, documentsProduced.get(), documentsConsumed.get(),
                errors.get(), getThroughputPerSecond(), getElapsedTimeSec());
    }
}
