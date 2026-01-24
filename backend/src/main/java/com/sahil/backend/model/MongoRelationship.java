package com.sahil.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mongo_relationships")
public class MongoRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "schema_id")
    private UUID schemaId;

    @Column(name = "source_collection")
    private String sourceCollection;

    @Column(name = "source_field")
    private String sourceField;

    @Column(name = "target_collection")
    private String targetCollection;

    @Column(name = "target_field")
    private String targetField; // Usually "_id"

    @Column(name = "relation_type")
    private String relationType; // ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY

    @Column
    private Double confidence; // 0.0-1.0 confidence score

    @Column(name = "detection_method")
    private String detectionMethod; // OBJECTID, NAMING_CONVENTION, AI_INFERENCE

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public MongoRelationship() {
    }

    public MongoRelationship(UUID schemaId, String sourceCollection, String sourceField,
            String targetCollection, String targetField, String relationType,
            Double confidence, String detectionMethod) {
        this.schemaId = schemaId;
        this.sourceCollection = sourceCollection;
        this.sourceField = sourceField;
        this.targetCollection = targetCollection;
        this.targetField = targetField;
        this.relationType = relationType;
        this.confidence = confidence;
        this.detectionMethod = detectionMethod;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSchemaId() {
        return schemaId;
    }

    public void setSchemaId(UUID schemaId) {
        this.schemaId = schemaId;
    }

    public String getSourceCollection() {
        return sourceCollection;
    }

    public void setSourceCollection(String sourceCollection) {
        this.sourceCollection = sourceCollection;
    }

    public String getSourceField() {
        return sourceField;
    }

    public void setSourceField(String sourceField) {
        this.sourceField = sourceField;
    }

    public String getTargetCollection() {
        return targetCollection;
    }

    public void setTargetCollection(String targetCollection) {
        this.targetCollection = targetCollection;
    }

    public String getTargetField() {
        return targetField;
    }

    public void setTargetField(String targetField) {
        this.targetField = targetField;
    }

    public String getRelationType() {
        return relationType;
    }

    public void setRelationType(String relationType) {
        this.relationType = relationType;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getDetectionMethod() {
        return detectionMethod;
    }

    public void setDetectionMethod(String detectionMethod) {
        this.detectionMethod = detectionMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
