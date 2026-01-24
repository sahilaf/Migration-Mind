package com.sahil.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.sahil.backend.config.MigrationConfig;
import com.sahil.backend.model.*;
import com.sahil.backend.repository.MigrationPlanRepository;
import com.sahil.backend.repository.MigrationProgressRepository;
import com.sahil.backend.repository.MigrationRepository;
import com.sahil.backend.repository.MigrationRunRepository;
import com.sahil.backend.service.worker.DocumentConsumer;
import com.sahil.backend.service.worker.DocumentProducer;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * Coordinator service that orchestrates the producer-consumer migration process
 * Manages the lifecycle of producers, consumers, and the blocking queue
 */
@Service
public class MigrationCoordinatorService {

    private static final Logger logger = LoggerFactory.getLogger(MigrationCoordinatorService.class);

    @Autowired
    private MigrationConfig config;

    @Autowired
    private MigrationRepository migrationRepository;

    @Autowired
    private MigrationPlanRepository migrationPlanRepository;

    @Autowired
    private MigrationRunRepository migrationRunRepository;

    @Autowired
    private MigrationProgressRepository migrationProgressRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Thread pools for producers and consumers
    private ExecutorService producerPool;
    private ExecutorService consumerPool;

    public MigrationRun executeMigration(UUID migrationId) {
        logger.info("Starting migration execution for migrationId: {}", migrationId);

        // 1. Load migration and plan
        Migration migration = migrationRepository.findById(migrationId)
                .orElseThrow(() -> new RuntimeException("Migration not found"));

        validateTargetCredentials(migration);

        MigrationPlan plan = migrationPlanRepository.findFirstByMigrationIdOrderByCreatedAtDesc(migrationId);
        if (plan == null) {
            throw new RuntimeException("No migration plan found");
        }

        // 2. Create run record
        MigrationRun run = new MigrationRun(migrationId, plan.getId(), "RUNNING");
        MigrationRun savedRun = migrationRunRepository.save(run);

        // 3. Initialize thread pools
        initializeThreadPools();

        // 4. Connect to databases
        MongoDatabase mongoDb = connectToMongoDB(migration);
        JdbcTemplate targetDb = connectToPostgreSQL(migration);

        // 5. Process each collection
        JsonNode tableMappings = plan.getPlanJson().get("tableMappings");
        List<CompletableFuture<Void>> collectionFutures = new ArrayList<>();

        if (tableMappings != null && tableMappings.isArray()) {
            for (JsonNode mapping : tableMappings) {
                CompletableFuture<Void> future = processCollectionAsync(
                        mapping, mongoDb, targetDb, savedRun.getId());
                collectionFutures.add(future);
            }
        }

        // 6. Monitor completion asynchronously
        CompletableFuture.allOf(collectionFutures.toArray(new CompletableFuture[0]))
                .thenAccept(v -> {
                    finalizeRun(savedRun);
                    shutdownThreadPools();
                    logger.info("Migration completed for migrationId: {}", migrationId);
                })
                .exceptionally(ex -> {
                    logger.error("Migration failed for migrationId: {}", migrationId, ex);
                    savedRun.setStatus("FAILED");
                    savedRun.setEndedAt(java.time.LocalDateTime.now());
                    migrationRunRepository.save(savedRun);
                    shutdownThreadPools();
                    return null;
                });

        return savedRun;
    }

    private CompletableFuture<Void> processCollectionAsync(
            JsonNode mapping,
            MongoDatabase mongoDb,
            JdbcTemplate targetDb,
            UUID runId) {

        return CompletableFuture.runAsync(() -> {
            String sourceCollection = mapping.get("sourceCollection").asText();
            String targetTable = mapping.get("targetTable").asText();
            JsonNode columns = mapping.get("columns");

            logger.info("Processing collection: {} -> {}", sourceCollection, targetTable);

            try {
                // Create target table
                createTargetTable(targetDb, targetTable, columns);

                // Create progress record
                MigrationProgress progress = new MigrationProgress(
                        runId, targetTable, 0L, 0L, "RUNNING");
                MigrationProgress savedProgress = migrationProgressRepository.save(progress);

                // Get total document count
                MongoCollection<Document> collection = mongoDb.getCollection(sourceCollection);
                long totalDocuments = collection.countDocuments();
                savedProgress.setRowsTotal(totalDocuments);
                migrationProgressRepository.save(savedProgress);

                logger.info("Collection {} has {} documents", sourceCollection, totalDocuments);

                // Setup queue and metrics
                BlockingQueue<DocumentBatch> queue = new ArrayBlockingQueue<>(config.getQueueCapacity());
                MigrationMetrics metrics = new MigrationMetrics(targetTable);

                // Start producers
                List<Future<?>> producers = startProducers(
                        collection, queue, metrics, sourceCollection, targetTable);

                // Start consumers
                List<Future<?>> consumers = startConsumers(
                        queue, targetDb, columns, targetTable, metrics, savedProgress.getId());

                // Wait for all producers to finish
                waitForCompletion(producers, "Producers");

                // Send poison pills to signal consumers to stop
                for (int i = 0; i < config.getConsumerThreads(); i++) {
                    queue.put(DocumentBatch.poison());
                }

                // Wait for all consumers to finish
                waitForCompletion(consumers, "Consumers");

                // Update final status
                savedProgress.setStatus("COMPLETED");
                savedProgress.setRowsProcessed(metrics.getDocumentsConsumed());
                migrationProgressRepository.save(savedProgress);

                logger.info("Completed collection: {} -> {} ({})",
                        sourceCollection, targetTable, metrics);

            } catch (Exception e) {
                logger.error("Failed to process collection: {} -> {}", sourceCollection, targetTable, e);
                throw new RuntimeException("Collection processing failed", e);
            }
        });
    }

    private List<Future<?>> startProducers(
            MongoCollection<Document> collection,
            BlockingQueue<DocumentBatch> queue,
            MigrationMetrics metrics,
            String collectionName,
            String targetTableName) {

        List<Future<?>> producers = new ArrayList<>();

        // Use only 1 producer per collection since MongoDB cursors can't be shared
        // Multiple producers would require data partitioning (skip/limit) which adds
        // complexity
        DocumentProducer producer = new DocumentProducer(
                collection,
                queue,
                metrics,
                config.getBatchSize(),
                config.getMongoFetchSize(),
                collectionName,
                targetTableName);
        producers.add(producerPool.submit(producer));

        logger.info("Started 1 producer for collection: {}", collectionName);
        return producers;
    }

    private List<Future<?>> startConsumers(
            BlockingQueue<DocumentBatch> queue,
            JdbcTemplate targetDb,
            JsonNode columns,
            String targetTable,
            MigrationMetrics metrics,
            UUID progressId) {

        List<Future<?>> consumers = new ArrayList<>();

        for (int i = 0; i < config.getConsumerThreads(); i++) {
            DocumentConsumer consumer = new DocumentConsumer(
                    queue,
                    targetDb,
                    columns,
                    targetTable,
                    metrics,
                    objectMapper,
                    config.getMaxRetries(),
                    config.getRetryDelayMs(),
                    migrationProgressRepository,
                    progressId,
                    i + 1 // Consumer ID
            );
            consumers.add(consumerPool.submit(consumer));
        }

        logger.info("Started {} consumers for table: {}", config.getConsumerThreads(), targetTable);
        return consumers;
    }

    private void waitForCompletion(List<Future<?>> futures, String workerType) {
        for (Future<?> future : futures) {
            try {
                future.get(); // Wait for completion
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.warn("{} interrupted", workerType);
            } catch (ExecutionException e) {
                logger.error("{} execution failed", workerType, e);
            }
        }
    }

    private void createTargetTable(JdbcTemplate targetJdbcTemplate, String tableName, JsonNode columns) {
        StringBuilder sql = new StringBuilder("CREATE TABLE IF NOT EXISTS ");
        sql.append(tableName).append(" (");

        List<String> columnDefs = new ArrayList<>();
        // PostgreSQL reserved keywords that need quoting
        Set<String> reservedKeywords = new HashSet<>();
        reservedKeywords.add("user");
        reservedKeywords.add("order");
        reservedKeywords.add("group");
        reservedKeywords.add("table");
        reservedKeywords.add("index");
        reservedKeywords.add("select");
        reservedKeywords.add("insert");
        reservedKeywords.add("update");
        reservedKeywords.add("delete");
        reservedKeywords.add("from");
        reservedKeywords.add("where");
        reservedKeywords.add("join");
        reservedKeywords.add("left");
        reservedKeywords.add("right");
        reservedKeywords.add("inner");
        reservedKeywords.add("outer");
        reservedKeywords.add("on");
        reservedKeywords.add("as");
        reservedKeywords.add("and");
        reservedKeywords.add("or");
        reservedKeywords.add("not");
        reservedKeywords.add("null");
        reservedKeywords.add("true");
        reservedKeywords.add("false");
        reservedKeywords.add("default");
        reservedKeywords.add("primary");
        reservedKeywords.add("foreign");
        reservedKeywords.add("key");
        reservedKeywords.add("references");
        reservedKeywords.add("constraint");
        reservedKeywords.add("check");
        reservedKeywords.add("unique");

        for (JsonNode col : columns) {
            String colName = col.get("targetColumn").asText();
            String dataType = col.get("dataType").asText();
            boolean nullable = !col.has("nullable") || col.get("nullable").asBoolean(); // Default to nullable
            boolean isPrimaryKey = col.has("primaryKey") && col.get("primaryKey").asBoolean();

            StringBuilder colDef = new StringBuilder();
            // Quote column name if it's a reserved keyword
            if (reservedKeywords.contains(colName.toLowerCase())) {
                colDef.append("\"").append(colName).append("\"");
            } else {
                colDef.append(colName);
            }
            colDef.append(" ").append(dataType);

            if (!nullable) {
                colDef.append(" NOT NULL");
            }

            if (isPrimaryKey) {
                colDef.append(" PRIMARY KEY");
            }

            columnDefs.add(colDef.toString());
        }

        sql.append(String.join(", ", columnDefs));
        sql.append(")");

        String finalSql = sql.toString();
        logger.info("Creating target table with SQL: {}", finalSql);

        try {
            targetJdbcTemplate.execute(finalSql);
            logger.info("Successfully created target table: {}", tableName);
        } catch (Exception e) {
            logger.error("Failed to create target table: {} - SQL: {}", tableName, finalSql, e);
            throw new RuntimeException("Failed to create target table: " + tableName + " - " + e.getMessage(), e);
        }
    }

    private MongoDatabase connectToMongoDB(Migration migration) {
        String connectionString;

        if (migration.getSourceUsername() != null && !migration.getSourceUsername().isEmpty()) {
            if (migration.getSourceHost().contains("mongodb.net")) {
                // MongoDB Atlas
                connectionString = String.format("mongodb+srv://%s:%s@%s/%s",
                        migration.getSourceUsername(),
                        migration.getSourcePassword(),
                        migration.getSourceHost(),
                        migration.getSourceDatabase());
            } else {
                // Standard MongoDB with auth
                connectionString = String.format("mongodb://%s:%s@%s:%d/%s",
                        migration.getSourceUsername(),
                        migration.getSourcePassword(),
                        migration.getSourceHost(),
                        migration.getSourcePort(),
                        migration.getSourceDatabase());
            }
        } else {
            // No authentication
            connectionString = String.format("mongodb://%s:%d",
                    migration.getSourceHost(),
                    migration.getSourcePort());
        }

        MongoClient mongoClient = MongoClients.create(connectionString);
        logger.info("Connected to MongoDB: {}", migration.getSourceHost());
        return mongoClient.getDatabase(migration.getSourceDatabase());
    }

    private JdbcTemplate connectToPostgreSQL(Migration migration) {
        String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s",
                migration.getTargetHost(),
                migration.getTargetPort(),
                migration.getTargetDatabase());

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl(jdbcUrl);
        dataSource.setUsername(migration.getTargetUsername());
        dataSource.setPassword(migration.getTargetPassword());

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // Test connection
        try {
            jdbcTemplate.execute("SELECT 1");
            logger.info("Connected to PostgreSQL: {}", migration.getTargetHost());
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to PostgreSQL: " + e.getMessage(), e);
        }

        return jdbcTemplate;
    }

    private void validateTargetCredentials(Migration migration) {
        if (migration.getTargetHost() == null || migration.getTargetPort() == null ||
                migration.getTargetDatabase() == null || migration.getTargetUsername() == null ||
                migration.getTargetPassword() == null) {
            throw new RuntimeException("Target database credentials are not configured");
        }
    }

    private void finalizeRun(MigrationRun run) {
        run.setEndedAt(java.time.LocalDateTime.now());
        run.setStatus("COMPLETED");
        migrationRunRepository.save(run);
    }

    private void initializeThreadPools() {
        if (producerPool == null || producerPool.isShutdown()) {
            producerPool = Executors.newCachedThreadPool();
        }
        if (consumerPool == null || consumerPool.isShutdown()) {
            consumerPool = Executors.newCachedThreadPool();
        }
    }

    private void shutdownThreadPools() {
        if (producerPool != null) {
            producerPool.shutdown();
        }
        if (consumerPool != null) {
            consumerPool.shutdown();
        }
    }
}
