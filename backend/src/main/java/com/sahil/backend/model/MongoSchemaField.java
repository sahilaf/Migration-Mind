package com.sahil.backend.model;

import jakarta.persistence.*;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "mongo_schema_fields")
public class MongoSchemaField {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "schema_id")
    private UUID schemaId;

    @Column(name = "collection_name")
    private String collectionName;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "field_path")
    private String fieldPath; // Dot notation for nested fields (e.g., "address.city")

    @Type(JsonType.class)
    @Column(name = "data_types", columnDefinition = "jsonb")
    private JsonNode dataTypes; // Array of observed types

    @Column
    private Double frequency; // Percentage of documents containing this field (0.0-1.0)

    @Column(name = "is_required")
    private Boolean isRequired;

    @Column(name = "is_array")
    private Boolean isArray;

    @Type(JsonType.class)
    @Column(name = "nested_schema", columnDefinition = "jsonb")
    private JsonNode nestedSchema; // For nested objects

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public MongoSchemaField() {
    }

    public MongoSchemaField(UUID schemaId, String collectionName, String fieldName, String fieldPath,
            JsonNode dataTypes, Double frequency, Boolean isRequired, Boolean isArray) {
        this.schemaId = schemaId;
        this.collectionName = collectionName;
        this.fieldName = fieldName;
        this.fieldPath = fieldPath;
        this.dataTypes = dataTypes;
        this.frequency = frequency;
        this.isRequired = isRequired;
        this.isArray = isArray;
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

    public String getCollectionName() {
        return collectionName;
    }

    public void setCollectionName(String collectionName) {
        this.collectionName = collectionName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getFieldPath() {
        return fieldPath;
    }

    public void setFieldPath(String fieldPath) {
        this.fieldPath = fieldPath;
    }

    public JsonNode getDataTypes() {
        return dataTypes;
    }

    public void setDataTypes(JsonNode dataTypes) {
        this.dataTypes = dataTypes;
    }

    public Double getFrequency() {
        return frequency;
    }

    public void setFrequency(Double frequency) {
        this.frequency = frequency;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
    }

    public Boolean getIsArray() {
        return isArray;
    }

    public void setIsArray(Boolean isArray) {
        this.isArray = isArray;
    }

    public JsonNode getNestedSchema() {
        return nestedSchema;
    }

    public void setNestedSchema(JsonNode nestedSchema) {
        this.nestedSchema = nestedSchema;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
