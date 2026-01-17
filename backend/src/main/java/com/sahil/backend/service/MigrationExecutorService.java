package com.sahil.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.sahil.backend.model.Migration;
import com.sahil.backend.model.MigrationPlan;
import com.sahil.backend.model.MigrationProgress;
import com.sahil.backend.model.MigrationRun;
import com.sahil.backend.repository.MigrationPlanRepository;
import com.sahil.backend.repository.MigrationProgressRepository;
import com.sahil.backend.repository.MigrationRepository;
import com.sahil.backend.repository.MigrationRunRepository;
import com.sahil.backend.service.worker.TableMigrationTask;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

@Service
public class MigrationExecutorService {

    @Autowired
    private MigrationRepository migrationRepository;

    @Autowired
    private MigrationPlanRepository migrationPlanRepository;

    @Autowired
    private MigrationRunRepository migrationRunRepository;

    @Autowired
    private MigrationProgressRepository migrationProgressRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    // Fixed thread pool
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    public MigrationRun executeMigration(UUID migrationId) {
        // 1. Fetch Migration & Plan
        Migration migration = migrationRepository.findById(migrationId)
                .orElseThrow(() -> new RuntimeException("Migration not found"));

        // Validate target database credentials
        if (migration.getTargetHost() == null || migration.getTargetPort() == null ||
                migration.getTargetDatabase() == null || migration.getTargetUsername() == null ||
                migration.getTargetPassword() == null) {
            throw new RuntimeException("Target database credentials are not configured");
        }

        MigrationPlan plan = migrationPlanRepository.findFirstByMigrationIdOrderByCreatedAtDesc(migrationId);
        if (plan == null) {
            throw new RuntimeException("No migration plan found");
        }

        // 2. Create Run Record
        MigrationRun run = new MigrationRun(migrationId, plan.getId(), "RUNNING");
        MigrationRun savedRun = migrationRunRepository.save(run);

        // 3. Connect to Source (Mongo)
        // Build connection string - support both standard MongoDB and MongoDB Atlas
        String connectionString;
        if (migration.getSourceUsername() != null && !migration.getSourceUsername().isEmpty()) {
            // MongoDB Atlas or authenticated MongoDB
            // Check if it's an Atlas cluster (contains mongodb.net)
            if (migration.getSourceHost().contains("mongodb.net")) {
                // MongoDB Atlas - use SRV connection string
                connectionString = String.format("mongodb+srv://%s:%s@%s/%s",
                        migration.getSourceUsername(),
                        migration.getSourcePassword(),
                        migration.getSourceHost(),
                        migration.getSourceDatabase());
            } else {
                // Standard MongoDB with authentication
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
        MongoDatabase mongoDatabase = mongoClient.getDatabase(migration.getSourceDatabase());

        // 4. Create Target Database Connection (PostgreSQL)
        String targetJdbcUrl = String.format("jdbc:postgresql://%s:%d/%s",
                migration.getTargetHost(),
                migration.getTargetPort(),
                migration.getTargetDatabase());

        org.springframework.jdbc.datasource.DriverManagerDataSource targetDataSource = new org.springframework.jdbc.datasource.DriverManagerDataSource();
        targetDataSource.setDriverClassName("org.postgresql.Driver");
        targetDataSource.setUrl(targetJdbcUrl);
        targetDataSource.setUsername(migration.getTargetUsername());
        targetDataSource.setPassword(migration.getTargetPassword());

        JdbcTemplate targetJdbcTemplate = new JdbcTemplate(targetDataSource);

        // Test target database connection
        try {
            targetJdbcTemplate.execute("SELECT 1");
            System.out.println("✅ Successfully connected to target database: " + targetJdbcUrl);
        } catch (Exception e) {
            String errorMsg = String.format(
                    "Failed to connect to target PostgreSQL database.\n" +
                            "Host: %s\n" +
                            "Port: %d\n" +
                            "Database: %s\n" +
                            "Username: %s\n" +
                            "Error: %s",
                    migration.getTargetHost(),
                    migration.getTargetPort(),
                    migration.getTargetDatabase(),
                    migration.getTargetUsername(),
                    e.getMessage());
            System.err.println("❌ " + errorMsg);
            throw new RuntimeException(errorMsg, e);
        }

        // 5. Parse Plan and Submit Tasks
        JsonNode planJson = plan.getPlanJson();
        JsonNode tableMappings = planJson.get("tableMappings");

        List<CompletableFuture<Boolean>> futures = new ArrayList<>();

        if (tableMappings != null && tableMappings.isArray()) {
            for (JsonNode mapping : tableMappings) {
                String sourceCollection = mapping.get("sourceCollection").asText();
                String targetTable = mapping.get("targetTable").asText();
                JsonNode columns = mapping.get("columns");

                // Create target table first
                try {
                    createTargetTable(targetJdbcTemplate, targetTable, columns);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to create target table: " + targetTable + " - " + e.getMessage(),
                            e);
                }

                // Create Progress Record
                MigrationProgress progress = new MigrationProgress(
                        savedRun.getId(),
                        targetTable,
                        0L,
                        0L,
                        "PENDING");
                MigrationProgress savedProgress = migrationProgressRepository.save(progress);

                // Create Task
                TableMigrationTask task = new TableMigrationTask(
                        sourceCollection,
                        targetTable,
                        columns,
                        mongoDatabase,
                        targetJdbcTemplate,
                        migrationProgressRepository,
                        savedProgress.getId(),
                        objectMapper);

                // Submit to Executor
                CompletableFuture<Boolean> future = CompletableFuture.supplyAsync(() -> task.call(), executorService);
                futures.add(future);
            }
        }

        // 6. Monitor Global Status (Async)
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .thenAccept(v -> {
                    // All done
                    boolean allSuccess = futures.stream().allMatch(f -> {
                        try {
                            return f.get();
                        } catch (Exception e) {
                            return false;
                        }
                    });

                    savedRun.setEndedAt(java.time.LocalDateTime.now());
                    savedRun.setStatus(allSuccess ? "COMPLETED" : "COMPLETED_WITH_ERRORS");
                    migrationRunRepository.save(savedRun);

                    // Cleanup
                    mongoClient.close();
                });

        return savedRun;
    }

    private void createTargetTable(JdbcTemplate targetJdbcTemplate, String tableName, JsonNode columns) {
        StringBuilder sql = new StringBuilder("CREATE TABLE IF NOT EXISTS ");
        sql.append(tableName).append(" (");

        List<String> columnDefs = new ArrayList<>();
        for (JsonNode col : columns) {
            String colName = col.get("targetColumn").asText();
            String dataType = col.get("dataType").asText();
            boolean nullable = col.has("nullable") && col.get("nullable").asBoolean();
            boolean isPrimaryKey = col.has("isPrimaryKey") && col.get("isPrimaryKey").asBoolean();

            StringBuilder colDef = new StringBuilder();
            colDef.append(colName).append(" ").append(dataType);

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

        targetJdbcTemplate.execute(sql.toString());
    }
}
