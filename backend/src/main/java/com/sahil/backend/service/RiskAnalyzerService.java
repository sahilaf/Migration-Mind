package com.sahil.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.sahil.backend.model.MigrationRisk;
import com.sahil.backend.model.MongoRelationship;
import com.sahil.backend.model.MongoSchemaField;
import com.sahil.backend.repository.MigrationRiskRepository;
import com.sahil.backend.repository.MongoRelationshipRepository;
import com.sahil.backend.repository.MongoSchemaFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RiskAnalyzerService {

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    @Autowired
    private MongoRelationshipRepository mongoRelationshipRepository;

    @Autowired
    private MigrationRiskRepository migrationRiskRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Analyzes migration risks
     */
    public List<MigrationRisk> analyzeRisks(UUID migrationId, UUID schemaId) {
        List<MigrationRisk> risks = new ArrayList<>();

        // Detect schema inconsistencies
        risks.addAll(detectSchemaInconsistencies(migrationId, schemaId));

        // Detect data loss risks
        risks.addAll(detectDataLossRisks(migrationId, schemaId));

        // Detect complexity risks
        risks.addAll(detectComplexityRisks(migrationId, schemaId));

        // Save all risks
        return migrationRiskRepository.saveAll(risks);
    }

    /**
     * Detects schema inconsistencies
     */
    private List<MigrationRisk> detectSchemaInconsistencies(UUID migrationId, UUID schemaId) {
        List<MigrationRisk> risks = new ArrayList<>();
        List<MongoSchemaField> fields = mongoSchemaFieldRepository.findBySchemaId(schemaId);

        for (MongoSchemaField field : fields) {
            // Check for type inconsistencies
            if (field.getDataTypes() != null && field.getDataTypes().size() > 1) {
                ArrayNode affectedCollections = objectMapper.createArrayNode();
                affectedCollections.add(field.getCollectionName());

                String description = String.format(
                        "Field '%s' in collection '%s' has inconsistent data types: %s. " +
                                "This may cause data loss or type conversion errors during migration.",
                        field.getFieldName(),
                        field.getCollectionName(),
                        field.getDataTypes().toString());

                String mitigation = "Review field values and standardize data types. " +
                        "Consider using the most general type (e.g., TEXT) or " +
                        "implement data transformation logic.";

                risks.add(new MigrationRisk(
                        migrationId,
                        "SCHEMA_INCONSISTENCY",
                        "MEDIUM",
                        description,
                        affectedCollections,
                        mitigation));
            }

            // Check for low frequency fields
            if (field.getFrequency() < 0.5 && field.getFrequency() > 0.0) {
                ArrayNode affectedCollections = objectMapper.createArrayNode();
                affectedCollections.add(field.getCollectionName());

                String description = String.format(
                        "Field '%s' in collection '%s' is only present in %.1f%% of documents. " +
                                "This indicates inconsistent schema usage.",
                        field.getFieldName(),
                        field.getCollectionName(),
                        field.getFrequency() * 100);

                String mitigation = "Make this field nullable in the target schema, or " +
                        "consider splitting into separate tables.";

                risks.add(new MigrationRisk(
                        migrationId,
                        "SCHEMA_INCONSISTENCY",
                        "LOW",
                        description,
                        affectedCollections,
                        mitigation));
            }
        }

        return risks;
    }

    /**
     * Detects data loss risks
     */
    private List<MigrationRisk> detectDataLossRisks(UUID migrationId, UUID schemaId) {
        List<MigrationRisk> risks = new ArrayList<>();
        List<MongoSchemaField> fields = mongoSchemaFieldRepository.findBySchemaId(schemaId);

        for (MongoSchemaField field : fields) {
            // Check for nested objects that will be flattened or stored as JSON
            if (field.getDataTypes() != null) {
                for (int i = 0; i < field.getDataTypes().size(); i++) {
                    String type = field.getDataTypes().get(i).asText();

                    if ("object".equals(type) || "array".equals(type)) {
                        ArrayNode affectedCollections = objectMapper.createArrayNode();
                        affectedCollections.add(field.getCollectionName());

                        String description = String.format(
                                "Field '%s' in collection '%s' contains complex nested data (%s). " +
                                        "This will be stored as JSONB or require denormalization.",
                                field.getFieldName(),
                                field.getCollectionName(),
                                type);

                        String mitigation = "Consider normalizing nested data into separate tables, " +
                                "or use JSONB column type in PostgreSQL to preserve structure.";

                        risks.add(new MigrationRisk(
                                migrationId,
                                "DATA_LOSS",
                                "MEDIUM",
                                description,
                                affectedCollections,
                                mitigation));
                        break; // Only report once per field
                    }
                }
            }
        }

        return risks;
    }

    /**
     * Detects complexity risks
     */
    private List<MigrationRisk> detectComplexityRisks(UUID migrationId, UUID schemaId) {
        List<MigrationRisk> risks = new ArrayList<>();
        List<MongoRelationship> relationships = mongoRelationshipRepository.findBySchemaId(schemaId);

        // Check for low-confidence relationships
        for (MongoRelationship rel : relationships) {
            if (rel.getConfidence() < 0.7) {
                ArrayNode affectedCollections = objectMapper.createArrayNode();
                affectedCollections.add(rel.getSourceCollection());
                affectedCollections.add(rel.getTargetCollection());

                String description = String.format(
                        "Detected relationship from '%s.%s' to '%s' has low confidence (%.1f%%). " +
                                "Manual review required.",
                        rel.getSourceCollection(),
                        rel.getSourceField(),
                        rel.getTargetCollection(),
                        rel.getConfidence() * 100);

                String mitigation = "Manually verify this relationship before migration. " +
                        "Check sample data to confirm the foreign key reference.";

                risks.add(new MigrationRisk(
                        migrationId,
                        "COMPLEXITY",
                        "MEDIUM",
                        description,
                        affectedCollections,
                        mitigation));
            }
        }

        // Check for collections with many relationships
        Map<String, Integer> relationshipCounts = new HashMap<>();
        for (MongoRelationship rel : relationships) {
            relationshipCounts.merge(rel.getSourceCollection(), 1, Integer::sum);
        }

        for (Map.Entry<String, Integer> entry : relationshipCounts.entrySet()) {
            if (entry.getValue() > 5) {
                ArrayNode affectedCollections = objectMapper.createArrayNode();
                affectedCollections.add(entry.getKey());

                String description = String.format(
                        "Collection '%s' has %d relationships. High coupling may impact migration performance.",
                        entry.getKey(),
                        entry.getValue());

                String mitigation = "Consider batching the migration and carefully planning " +
                        "the order of table creation to satisfy foreign key constraints.";

                risks.add(new MigrationRisk(
                        migrationId,
                        "COMPLEXITY",
                        "LOW",
                        description,
                        affectedCollections,
                        mitigation));
            }
        }

        return risks;
    }
}
