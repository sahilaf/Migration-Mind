package com.sahil.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sahil.backend.model.Migration;
import com.sahil.backend.model.MigrationPlan;
import com.sahil.backend.model.MigrationRun;
import com.sahil.backend.repository.MigrationPlanRepository;
import com.sahil.backend.repository.MigrationRepository;
import com.sahil.backend.util.ConnectionHashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/migrations")
@CrossOrigin(origins = "*")
public class MigrationController {

    @Autowired
    private MigrationRepository migrationRepository;

    @Autowired
    private MigrationPlanRepository migrationPlanRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Check if analysis exists for a database connection
     * GET /api/migrations/check-existing
     */
    @GetMapping("/check-existing")
    public ResponseEntity<?> checkExistingAnalysis(
            @RequestParam String host,
            @RequestParam Integer port,
            @RequestParam String database,
            @RequestParam UUID userId) {
        try {
            String connectionHash = ConnectionHashUtil.generateHash(host, port, database);

            Optional<Migration> migration = migrationRepository
                    .findByUserIdAndConnectionHash(userId, connectionHash);

            if (migration.isPresent() && Boolean.TRUE.equals(migration.get().getHasAnalysis())) {
                Migration existingMigration = migration.get();
                ObjectNode response = objectMapper.createObjectNode();
                response.put("exists", true);
                response.put("migrationId", existingMigration.getId().toString());
                if (existingMigration.getLastAnalyzedAt() != null) {
                    response.put("lastAnalyzedAt", existingMigration.getLastAnalyzedAt().toString());
                }
                response.put("hasMigrationPlan",
                        existingMigration.getHasMigrationPlan() != null && existingMigration.getHasMigrationPlan());
                return ResponseEntity.ok(response);
            }

            ObjectNode response = objectMapper.createObjectNode();
            response.put("exists", false);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get all migrations for a user
     * GET /api/migrations/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserMigrations(@PathVariable UUID userId) {
        try {
            List<Migration> migrations = migrationRepository.findByUserIdOrderByCreatedAtDesc(userId);

            // Create response with migrations and their plans
            ArrayNode migrationsArray = objectMapper.createArrayNode();

            for (Migration migration : migrations) {
                ObjectNode migrationNode = objectMapper.createObjectNode();
                migrationNode.put("id", migration.getId().toString());
                migrationNode.put("name", migration.getName());
                migrationNode.put("status", migration.getStatus());
                migrationNode.put("createdAt", migration.getCreatedAt().toString());
                migrationNode.put("updatedAt", migration.getUpdatedAt().toString());

                // Add connection info
                if (migration.getSourceHost() != null) {
                    migrationNode.put("sourceHost", migration.getSourceHost());
                }
                if (migration.getSourcePort() != null) {
                    migrationNode.put("sourcePort", migration.getSourcePort());
                }
                if (migration.getSourceDatabase() != null) {
                    migrationNode.put("sourceDatabase", migration.getSourceDatabase());
                }
                if (migration.getLastAnalyzedAt() != null) {
                    migrationNode.put("lastAnalyzedAt", migration.getLastAnalyzedAt().toString());
                }
                migrationNode.put("hasAnalysis",
                        migration.getHasAnalysis() != null && migration.getHasAnalysis());
                migrationNode.put("hasMigrationPlan",
                        migration.getHasMigrationPlan() != null && migration.getHasMigrationPlan());

                // Find associated migration plan
                MigrationPlan plan = migrationPlanRepository
                        .findFirstByMigrationIdOrderByCreatedAtDesc(migration.getId());
                if (plan != null) {
                    ObjectNode planNode = objectMapper.createObjectNode();
                    planNode.put("id", plan.getId().toString());
                    planNode.put("status", plan.getStatus());
                    planNode.put("createdAt", plan.getCreatedAt().toString());
                    planNode.set("planJson", plan.getPlanJson());
                    migrationNode.set("migrationPlan", planNode);
                } else {
                    migrationNode.set("migrationPlan", null);
                }

                migrationsArray.add(migrationNode);
            }

            ObjectNode response = objectMapper.createObjectNode();
            response.set("migrations", migrationsArray);
            response.put("totalCount", migrations.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get a specific migration with its plan
     * GET /api/migrations/{migrationId}
     */
    @GetMapping("/{migrationId}")
    public ResponseEntity<?> getMigration(@PathVariable UUID migrationId) {
        try {
            Migration migration = migrationRepository.findById(migrationId).orElse(null);

            if (migration == null) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Migration not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            ObjectNode migrationNode = objectMapper.createObjectNode();
            migrationNode.put("id", migration.getId().toString());
            migrationNode.put("name", migration.getName());
            migrationNode.put("status", migration.getStatus());
            migrationNode.put("userId", migration.getUserId().toString());
            migrationNode.put("createdAt", migration.getCreatedAt().toString());
            migrationNode.put("updatedAt", migration.getUpdatedAt().toString());

            // Add target database info (for debugging)
            if (migration.getTargetHost() != null) {
                migrationNode.put("targetHost", migration.getTargetHost());
                migrationNode.put("targetPort", migration.getTargetPort());
                migrationNode.put("targetDatabase", migration.getTargetDatabase());
                migrationNode.put("hasTargetCredentials", true);
            } else {
                migrationNode.put("hasTargetCredentials", false);
            }

            // Find associated migration plan
            MigrationPlan plan = migrationPlanRepository.findFirstByMigrationIdOrderByCreatedAtDesc(migrationId);
            if (plan != null) {
                ObjectNode planNode = objectMapper.createObjectNode();
                planNode.put("id", plan.getId().toString());
                planNode.put("status", plan.getStatus());
                planNode.put("createdAt", plan.getCreatedAt().toString());
                planNode.set("planJson", plan.getPlanJson());
                migrationNode.set("migrationPlan", planNode);
            } else {
                migrationNode.set("migrationPlan", null);
            }

            return ResponseEntity.ok(migrationNode);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Create a new migration
     * POST /api/migrations
     */
    @PostMapping
    public ResponseEntity<?> createMigration(@RequestBody CreateMigrationRequest request) {
        try {
            Migration migration = new Migration(
                    request.getUserId(),
                    request.getName(),
                    "DRAFT");

            Migration savedMigration = migrationRepository.save(migration);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("id", savedMigration.getId().toString());
            response.put("name", savedMigration.getName());
            response.put("status", savedMigration.getStatus());
            response.put("userId", savedMigration.getUserId().toString());
            response.put("createdAt", savedMigration.getCreatedAt().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Request DTO for creating migrations
     */
    public static class CreateMigrationRequest {
        private UUID userId;
        private String name;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    /**
     * Update target database credentials
     * PUT /api/migrations/{migrationId}/target-credentials
     */
    @PutMapping("/{migrationId}/target-credentials")
    public ResponseEntity<?> updateTargetCredentials(
            @PathVariable UUID migrationId,
            @RequestBody TargetCredentialsRequest request) {
        try {
            Migration migration = migrationRepository.findById(migrationId).orElse(null);

            if (migration == null) {
                ObjectNode errorResponse = objectMapper.createObjectNode();
                errorResponse.put("error", "Migration not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            // Update target database credentials
            migration.setTargetHost(request.getTargetHost());
            migration.setTargetPort(request.getTargetPort());
            migration.setTargetDatabase(request.getTargetDatabase());
            migration.setTargetUsername(request.getTargetUsername());
            migration.setTargetPassword(request.getTargetPassword());
            migration.setUpdatedAt(java.time.LocalDateTime.now());

            migrationRepository.save(migration);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("success", true);
            response.put("message", "Target database credentials updated successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Request DTO for target database credentials
     */
    public static class TargetCredentialsRequest {
        private String targetHost;
        private Integer targetPort;
        private String targetDatabase;
        private String targetUsername;
        private String targetPassword;

        public String getTargetHost() {
            return targetHost;
        }

        public void setTargetHost(String targetHost) {
            this.targetHost = targetHost;
        }

        public Integer getTargetPort() {
            return targetPort;
        }

        public void setTargetPort(Integer targetPort) {
            this.targetPort = targetPort;
        }

        public String getTargetDatabase() {
            return targetDatabase;
        }

        public void setTargetDatabase(String targetDatabase) {
            this.targetDatabase = targetDatabase;
        }

        public String getTargetUsername() {
            return targetUsername;
        }

        public void setTargetUsername(String targetUsername) {
            this.targetUsername = targetUsername;
        }

        public String getTargetPassword() {
            return targetPassword;
        }

        public void setTargetPassword(String targetPassword) {
            this.targetPassword = targetPassword;
        }
    }

    @Autowired
    private com.sahil.backend.service.MigrationCoordinatorService migrationCoordinatorService;

    @Autowired
    private com.sahil.backend.config.MigrationConfig migrationConfig;

    /**
     * Execute migration using producer-consumer pattern
     * POST /api/migrations/{migrationId}/execute
     */
    @PostMapping("/{migrationId}/execute")
    public ResponseEntity<?> executeMigration(@PathVariable UUID migrationId) {
        try {
            MigrationRun run = migrationCoordinatorService.executeMigration(migrationId);

            ObjectNode response = objectMapper.createObjectNode();
            response.put("runId", run.getId().toString());
            response.put("status", run.getStatus());
            response.put("message", "Migration started successfully");
            response.put("mode", "producer-consumer");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ObjectNode errorResponse = objectMapper.createObjectNode();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/run/{runId}/progress")
    public ResponseEntity<?> getMigrationProgress(@PathVariable UUID runId) {
        try {
            List<com.sahil.backend.model.MigrationProgress> progressList = migrationProgressRepository
                    .findByRunId(runId);

            return ResponseEntity.ok(progressList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Autowired
    private com.sahil.backend.repository.MigrationProgressRepository migrationProgressRepository;
}
