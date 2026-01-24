package com.sahil.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "migration")
public class MigrationConfig {

    // Thread pool configuration
    private int producerThreads = 2; // Producers per collection
    private int consumerThreads = 4; // Consumers per collection

    // Queue configuration
    private int queueCapacity = 10000; // Max batches in queue
    private int batchSize = 1000; // Documents per batch

    // Retry configuration
    private int maxRetries = 3; // Retry attempts for failed batches
    private long retryDelayMs = 1000; // Delay between retries (ms)

    // MongoDB configuration
    private int mongoFetchSize = 5000; // MongoDB cursor batch size

    // PostgreSQL configuration
    private int postgresPoolSize = 10; // Connection pool size

    // Enable/disable producer-consumer mode
    private boolean useProducerConsumer = true;

    // Getters and Setters

    public int getProducerThreads() {
        return producerThreads;
    }

    public void setProducerThreads(int producerThreads) {
        this.producerThreads = producerThreads;
    }

    public int getConsumerThreads() {
        return consumerThreads;
    }

    public void setConsumerThreads(int consumerThreads) {
        this.consumerThreads = consumerThreads;
    }

    public int getQueueCapacity() {
        return queueCapacity;
    }

    public void setQueueCapacity(int queueCapacity) {
        this.queueCapacity = queueCapacity;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public long getRetryDelayMs() {
        return retryDelayMs;
    }

    public void setRetryDelayMs(long retryDelayMs) {
        this.retryDelayMs = retryDelayMs;
    }

    public int getMongoFetchSize() {
        return mongoFetchSize;
    }

    public void setMongoFetchSize(int mongoFetchSize) {
        this.mongoFetchSize = mongoFetchSize;
    }

    public int getPostgresPoolSize() {
        return postgresPoolSize;
    }

    public void setPostgresPoolSize(int postgresPoolSize) {
        this.postgresPoolSize = postgresPoolSize;
    }

    public boolean isUseProducerConsumer() {
        return useProducerConsumer;
    }

    public void setUseProducerConsumer(boolean useProducerConsumer) {
        this.useProducerConsumer = useProducerConsumer;
    }
}
