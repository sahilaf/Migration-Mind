package com.sahil.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sahil.backend.model.*;
import com.sahil.backend.repository.*;
import com.sahil.backend.service.*;
import com.sahil.backend.util.ConnectionHashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/mongo")
@CrossOrigin(origins = "*")
public class MongoAnalysisController {

    @Autowired
    private MongoConnectionService mongoConnectionService;

    @Autowired
    private MongoAnalysisOrchestratorService analysisOrchestrator;

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    @Autowired
    private MongoRelationshipRepository mongoRelationshipRepository;

    @Autowired
    private MigrationRiskRepository migrationRiskRepository;

    @Autowired
    private MigrationPlanRepository migrationPlanRepository;

    @Autowired
    private SchemaRepository schemaRepository;

    @Autowired
    private MigrationPlanGeneratorService migrationPlanGeneratorService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MigrationRepository migrationRepository;

    /**
     * Get or create a migration for a database connection
     * This ensures we update existing analysis instead of creating duplicates
     * POST /api/mongo/get-or-create-migration
     */
    @PostMapping("/get-or-create-migration")
    public ResponseEntity<?> getOrCreateMigration(@RequestBody GetOrCreateMigrationRequest request) {
        try {
            String connectionHash = ConnectionHashUtil.generateHash(
                    request.getHost(),
                    request.getPort(),
                    request.getDatabaseName());

            // Check if migration exists for this user and connection
            Optional<Migration> existingMigration = migrationRepository
                    .findByUserIdAndConnectionHash(request.getUserId(), connectionHash);

            if (existingMigration.isPresent()) {
                Migration migration = existingMigration.get();
                ObjectNode response = objectMapper.createObjectNode();
                response.put("migrationId", migration.getId().toString());
                response.put("isExisting", true);
                response.put("hasAnalysis", migration.getHasAnalysis() != null && migration.getHasAnalysis());
                response.put("hasMigrationPlan",
                        migration.getHasMigrationPlan() != null && migration.getHasMigrationPlan());
                if (migration.getLastAnalyzedAt() != null) {
                    response.put("lastAnalyzedAt", migration.getLastAnalyzedAt().toString());
                }
                return ResponseEntity.ok(response);
            }

            // Create new migration
            String migrationName = request.getDatabaseName() + " Migration";
            Migration migration = new Migration(request.getUserId(), migrationName, "DRAFT");
            migration.setConnectionHash(connectionHash);
            migration.setSourceHost(request.getHost());
            migration.setSourcePort(request.getPort());
            migration.setSourceDatabase(request.getDatabaseName());
            Migration savedMigration = migrationRepository.save(migration);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("migrationId", savedMigration.getId().toString());
            response.put("isExisting", false);
            response.put("hasAnalysis", false);
            response.put("hasMigrationPlan", false);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Test MongoDB connection
     * POST /api/mongo/connections/test
     */
    @PostMapping("/connections/test")
    public ResponseEntity<?> testConnection(@RequestBody DbConnection dbConnection) {
        try {
            List<String> collections = mongoConnectionService.testConnection(dbConnection);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("success", true);
            response.put("message", "Connection successful");
            response.set("collections", objectMapper.valueToTree(collections));
            response.put("collectionCount", collections.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * Trigger full MongoDB analysis
     * POST /api/mongo/analyze/{migrationId}
     */
    @PostMapping("/analyze/{migrationId}")
    public ResponseEntity<?> analyzeDatabase(
            @PathVariable UUID migrationId,
            @RequestBody AnalysisRequest request) {

        try {
            // Validate request
            if (request.getDbConnection() == null) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Database connection details required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            int sampleSize = request.getSampleSize() != null ? request.getSampleSize() : 1000;

            DbConnection conn = request.getDbConnection();

            // Run analysis
            MongoAnalysisOrchestratorService.AnalysisResult result = analysisOrchestrator
                    .runCompleteAnalysis(migrationId, conn, sampleSize);

            if (result.isSuccess()) {
                // Save connection info to migration
                Optional<Migration> migrationOpt = migrationRepository.findById(migrationId);
                if (migrationOpt.isPresent()) {
                    Migration migration = migrationOpt.get();
                    String connectionHash = ConnectionHashUtil.generateHash(
                            conn.getHost(),
                            conn.getPort(),
                            conn.getDatabaseName());
                    migration.setConnectionHash(connectionHash);
                    migration.setSourceHost(conn.getHost());
                    migration.setSourcePort(conn.getPort());
                    migration.setSourceDatabase(conn.getDatabaseName());
                    migration.setSourceUsername(conn.getUsername());
                    migration.setSourcePassword(conn.getPassword());
                    migration.setLastAnalyzedAt(java.time.LocalDateTime.now());
                    migration.setHasAnalysis(true);
                    migrationRepository.save(migration);
                }

                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get discovered schemas for a migration
     * GET /api/mongo/schema/{migrationId}
     */
    @GetMapping("/schema/{migrationId}")
    public ResponseEntity<?> getSchemas(@PathVariable UUID migrationId) {
        try {
            // Find schema by migration ID
            Optional<Schema> schemaOpt = schemaRepository.findAll().stream()
                    .filter(s -> migrationId.equals(s.getMigrationId()))
                    .findFirst();

            if (schemaOpt.isEmpty()) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Schema not found for migration");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Schema schema = schemaOpt.get();
            List<MongoSchemaField> fields = mongoSchemaFieldRepository.findBySchemaId(schema.getId());

            // Group fields by collection
            Map<String, List<MongoSchemaField>> fieldsByCollection = new HashMap<>();
            for (MongoSchemaField field : fields) {
                fieldsByCollection
                        .computeIfAbsent(field.getCollectionName(), k -> new ArrayList<>())
                        .add(field);
            }

            ObjectNode response = objectMapper.createObjectNode();
            response.put("schemaId", schema.getId().toString());
            response.set("collections", objectMapper.valueToTree(fieldsByCollection));
            response.put("totalFields", fields.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get detected relationships
     * GET /api/mongo/relationships/{migrationId}
     */
    @GetMapping("/relationships/{migrationId}")
    public ResponseEntity<?> getRelationships(@PathVariable UUID migrationId) {
        try {
            // Find schema by migration ID
            Optional<Schema> schemaOpt = schemaRepository.findAll().stream()
                    .filter(s -> migrationId.equals(s.getMigrationId()))
                    .findFirst();

            if (schemaOpt.isEmpty()) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Schema not found for migration");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Schema schema = schemaOpt.get();
            List<MongoRelationship> relationships = mongoRelationshipRepository.findBySchemaId(schema.getId());

            ObjectNode response = objectMapper.createObjectNode();
            response.set("relationships", objectMapper.valueToTree(relationships));
            response.put("totalCount", relationships.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get migration risks
     * GET /api/mongo/risks/{migrationId}
     */
    @GetMapping("/risks/{migrationId}")
    public ResponseEntity<?> getRisks(@PathVariable UUID migrationId) {
        try {
            List<MigrationRisk> risks = migrationRiskRepository.findByMigrationIdOrderBySeverityDesc(migrationId);

            // Group by severity
            Map<String, List<MigrationRisk>> risksBySeverity = new HashMap<>();
            for (MigrationRisk risk : risks) {
                risksBySeverity
                        .computeIfAbsent(risk.getSeverity(), k -> new ArrayList<>())
                        .add(risk);
            }

            ObjectNode response = objectMapper.createObjectNode();
            response.set("risks", objectMapper.valueToTree(risks));
            response.set("bySeverity", objectMapper.valueToTree(risksBySeverity));
            response.put("totalCount", risks.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get migration plan
     * GET /api/mongo/migration-plan/{migrationId}
     */
    @GetMapping("/migration-plan/{migrationId}")
    public ResponseEntity<?> getMigrationPlan(@PathVariable UUID migrationId) {
        try {
            // Find latest migration plan
            Optional<MigrationPlan> planOpt = migrationPlanRepository.findAll().stream()
                    .filter(p -> migrationId.equals(p.getMigrationId()))
                    .max(Comparator.comparing(MigrationPlan::getCreatedAt));

            if (planOpt.isEmpty()) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Migration plan not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            MigrationPlan plan = planOpt.get();
            return ResponseEntity.ok(plan);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Generate migration plan
     * POST /api/mongo/migration-plan/generate/{migrationId}
     */
    @PostMapping("/migration-plan/generate/{migrationId}")
    public ResponseEntity<?> generateMigrationPlan(@PathVariable UUID migrationId) {
        try {
            MigrationPlan plan = migrationPlanGeneratorService.generateAndSavePlan(migrationId);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get collection statistics
     * GET /api/mongo/stats/{migrationId}
     */
    @GetMapping("/stats/{migrationId}")
    public ResponseEntity<?> getStatistics(@PathVariable UUID migrationId) {
        try {
            // Find schema by migration ID
            Optional<Schema> schemaOpt = schemaRepository.findAll().stream()
                    .filter(s -> migrationId.equals(s.getMigrationId()))
                    .findFirst();

            if (schemaOpt.isEmpty()) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Schema not found for migration");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Schema schema = schemaOpt.get();

            // Gather statistics
            List<MongoSchemaField> fields = mongoSchemaFieldRepository.findBySchemaId(schema.getId());
            List<MongoRelationship> relationships = mongoRelationshipRepository.findBySchemaId(schema.getId());
            List<MigrationRisk> risks = migrationRiskRepository.findByMigrationId(migrationId);

            // Count collections
            Set<String> collections = new HashSet<>();
            for (MongoSchemaField field : fields) {
                collections.add(field.getCollectionName());
            }

            ObjectNode stats = objectMapper.createObjectNode();
            stats.put("collectionCount", collections.size());
            stats.put("totalFields", fields.size());
            stats.put("relationshipCount", relationships.size());
            stats.put("riskCount", risks.size());
            stats.put("analyzed", schema.getAnalyzed());

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Request DTO for analysis
     */
    public static class AnalysisRequest {
        private DbConnection dbConnection;
        private Integer sampleSize;
        private Boolean includeAI;

        public DbConnection getDbConnection() {
            return dbConnection;
        }

        public void setDbConnection(DbConnection dbConnection) {
            this.dbConnection = dbConnection;
        }

        public Integer getSampleSize() {
            return sampleSize;
        }

        public void setSampleSize(Integer sampleSize) {
            this.sampleSize = sampleSize;
        }

        public Boolean getIncludeAI() {
            return includeAI;
        }

        public void setIncludeAI(Boolean includeAI) {
            this.includeAI = includeAI;
        }
    }

    /**
     * Request DTO for get-or-create migration
     */
    public static class GetOrCreateMigrationRequest {
        private UUID userId;
        private String host;
        private Integer port;
        private String databaseName;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getHost() {
            return host;
        }

        public void setHost(String host) {
            this.host = host;
        }

        public Integer getPort() {
            return port;
        }

        public void setPort(Integer port) {
            this.port = port;
        }

        public String getDatabaseName() {
            return databaseName;
        }

        public void setDatabaseName(String databaseName) {
            this.databaseName = databaseName;
        }
    }
}
