package com.sahil.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sahil.backend.model.MongoSchemaField;
import com.sahil.backend.repository.MongoSchemaFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StructuralAnalyzerService {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    /**
     * Analyzes collection structure and saves to database
     */
    public List<MongoSchemaField> analyzeCollectionStructure(
            UUID schemaId,
            String collectionName,
            Map<String, MongoSamplerService.FieldInfo> fieldStats,
            int totalSamples) {

        List<MongoSchemaField> schemaFields = new ArrayList<>();

        for (Map.Entry<String, MongoSamplerService.FieldInfo> entry : fieldStats.entrySet()) {
            String fieldPath = entry.getKey();
            MongoSamplerService.FieldInfo info = entry.getValue();

            // Skip nested object fields (they'll be captured in nestedSchema)
            if (!fieldPath.contains(".") || fieldPath.contains("[]")) {
                String fieldName = extractFieldName(fieldPath);
                double frequency = info.getFrequency(totalSamples);
                boolean isRequired = frequency > 0.95; // Consider required if present in >95% of docs

                // Convert data types to JSON array
                ArrayNode dataTypesJson = objectMapper.createArrayNode();
                for (String type : info.getDataTypes()) {
                    dataTypesJson.add(type);
                }

                MongoSchemaField field = new MongoSchemaField(
                        schemaId,
                        collectionName,
                        fieldName,
                        fieldPath,
                        dataTypesJson,
                        frequency,
                        isRequired,
                        info.isArray());

                schemaFields.add(field);
            }
        }

        // Save to database
        return mongoSchemaFieldRepository.saveAll(schemaFields);
    }

    /**
     * Detects if field types are inconsistent across documents
     */
    public boolean hasTypeInconsistency(MongoSchemaField field) {
        JsonNode dataTypes = field.getDataTypes();
        return dataTypes != null && dataTypes.size() > 1;
    }

    /**
     * Suggests SQL data type based on MongoDB types
     */
    public String suggestSqlType(MongoSchemaField field) {
        JsonNode dataTypes = field.getDataTypes();
        if (dataTypes == null || dataTypes.size() == 0) {
            return "TEXT";
        }

        // Get the most common/primary type
        String primaryType = dataTypes.get(0).asText();

        switch (primaryType) {
            case "string":
                return "VARCHAR(255)";
            case "int32":
                return "INTEGER";
            case "int64":
                return "BIGINT";
            case "double":
                return "DOUBLE PRECISION";
            case "boolean":
                return "BOOLEAN";
            case "date":
                return "TIMESTAMP";
            case "objectId":
                return "VARCHAR(24)"; // ObjectId as hex string
            case "array":
                return "JSONB"; // Store arrays as JSON
            case "object":
                return "JSONB"; // Store nested objects as JSON
            default:
                return "TEXT";
        }
    }

    /**
     * Extracts field name from field path
     */
    private String extractFieldName(String fieldPath) {
        if (fieldPath.contains(".")) {
            String[] parts = fieldPath.split("\\.");
            return parts[parts.length - 1];
        }
        return fieldPath;
    }

    /**
     * Builds a hierarchical schema representation
     */
    public ObjectNode buildSchemaRepresentation(List<MongoSchemaField> fields) {
        ObjectNode schema = objectMapper.createObjectNode();
        ObjectNode properties = objectMapper.createObjectNode();

        for (MongoSchemaField field : fields) {
            ObjectNode fieldSchema = objectMapper.createObjectNode();

            // Add type information
            if (field.getDataTypes() != null && field.getDataTypes().size() > 0) {
                if (field.getDataTypes().size() == 1) {
                    fieldSchema.put("type", field.getDataTypes().get(0).asText());
                } else {
                    fieldSchema.set("types", field.getDataTypes());
                }
            }

            fieldSchema.put("frequency", field.getFrequency());
            fieldSchema.put("required", field.getIsRequired());

            if (field.getIsArray()) {
                fieldSchema.put("isArray", true);
            }

            properties.set(field.getFieldName(), fieldSchema);
        }

        schema.set("properties", properties);
        return schema;
    }
}
