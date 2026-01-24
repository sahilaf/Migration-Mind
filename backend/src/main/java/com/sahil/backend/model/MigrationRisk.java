package com.sahil.backend.model;

import jakarta.persistence.*;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "migration_risks")
public class MigrationRisk {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "migration_id")
    private UUID migrationId;

    @Column(name = "risk_type")
    private String riskType; // SCHEMA_INCONSISTENCY, DATA_LOSS, PERFORMANCE, COMPLEXITY

    @Column
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(columnDefinition = "TEXT")
    private String description;

    @Type(JsonType.class)
    @Column(name = "affected_collections", columnDefinition = "jsonb")
    private JsonNode affectedCollections;

    @Column(columnDefinition = "TEXT")
    private String mitigation;

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public MigrationRisk() {
    }

    public MigrationRisk(UUID migrationId, String riskType, String severity,
            String description, JsonNode affectedCollections, String mitigation) {
        this.migrationId = migrationId;
        this.riskType = riskType;
        this.severity = severity;
        this.description = description;
        this.affectedCollections = affectedCollections;
        this.mitigation = mitigation;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMigrationId() {
        return migrationId;
    }

    public void setMigrationId(UUID migrationId) {
        this.migrationId = migrationId;
    }

    public String getRiskType() {
        return riskType;
    }

    public void setRiskType(String riskType) {
        this.riskType = riskType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public JsonNode getAffectedCollections() {
        return affectedCollections;
    }

    public void setAffectedCollections(JsonNode affectedCollections) {
        this.affectedCollections = affectedCollections;
    }

    public String getMitigation() {
        return mitigation;
    }

    public void setMitigation(String mitigation) {
        this.mitigation = mitigation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
