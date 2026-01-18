package com.sahil.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sahil.backend.model.MigrationPlan;
import com.sahil.backend.model.Migration;
import com.sahil.backend.model.MongoRelationship;
import com.sahil.backend.model.MongoSchemaField;
import com.sahil.backend.model.Schema;
import com.sahil.backend.repository.MongoRelationshipRepository;
import com.sahil.backend.repository.MongoSchemaFieldRepository;
import com.sahil.backend.repository.MigrationPlanRepository;
import com.sahil.backend.repository.MigrationRepository;
import com.sahil.backend.repository.SchemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MigrationPlanGeneratorService {

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    @Autowired
    private MongoRelationshipRepository mongoRelationshipRepository;

    @Autowired
    private StructuralAnalyzerService structuralAnalyzerService;

    @Autowired
    private SchemaRepository schemaRepository;

    @Autowired
    private MigrationPlanRepository migrationPlanRepository;

    @Autowired
    private MigrationRepository migrationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Generate and persist migration plan for a migration ID
     */
    public MigrationPlan generateAndSavePlan(UUID migrationId) {
        // Find schema
        Schema schema = schemaRepository.findAll().stream()
                .filter(s -> migrationId.equals(s.getMigrationId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Schema not found for migration ID: " + migrationId));

        // Generate plan
        ObjectNode planJson = generateMigrationPlan(schema.getId());

        // Save to database
        MigrationPlan plan = new MigrationPlan(migrationId, "DRAFT", planJson);
        MigrationPlan savedPlan = migrationPlanRepository.save(plan);

        // Update the migration to indicate it has a plan
        migrationRepository.findById(migrationId).ifPresent(migration -> {
            migration.setHasMigrationPlan(true);
            migrationRepository.save(migration);
        });

        return savedPlan;
    }

    /**
     * Generates comprehensive migration plan
     */
    public ObjectNode generateMigrationPlan(UUID schemaId) {
        List<MongoSchemaField> fields = mongoSchemaFieldRepository.findBySchemaId(schemaId);
        List<MongoRelationship> relationships = mongoRelationshipRepository.findBySchemaId(schemaId);

        ObjectNode plan = objectMapper.createObjectNode();

        // Group fields by collection
        Map<String, List<MongoSchemaField>> fieldsByCollection = fields.stream()
                .collect(Collectors.groupingBy(MongoSchemaField::getCollectionName));

        // Generate table mappings
        ArrayNode tableMappings = generateTableMappings(fieldsByCollection);
        plan.set("tableMappings", tableMappings);

        // Generate foreign keys
        ArrayNode foreignKeys = generateForeignKeys(relationships);
        plan.set("foreignKeys", foreignKeys);

        // Generate indexes
        ArrayNode indexes = generateIndexSuggestions(relationships, fields);
        plan.set("indexes", indexes);

        // Generate migration steps
        ArrayNode migrationSteps = generateMigrationSteps(fieldsByCollection, relationships);
        plan.set("migrationSteps", migrationSteps);

        return plan;
    }

    /**
     * Generates table mappings from collections
     */
    private ArrayNode generateTableMappings(Map<String, List<MongoSchemaField>> fieldsByCollection) {
        ArrayNode mappings = objectMapper.createArrayNode();

        for (Map.Entry<String, List<MongoSchemaField>> entry : fieldsByCollection.entrySet()) {
            String collectionName = entry.getKey();
            List<MongoSchemaField> fields = entry.getValue();

            ObjectNode tableMapping = objectMapper.createObjectNode();
            tableMapping.put("sourceCollection", collectionName);
            tableMapping.put("targetTable", collectionName); // Use same name by default

            // Generate columns
            ArrayNode columns = objectMapper.createArrayNode();
            for (MongoSchemaField field : fields) {
                if (!field.getFieldPath().contains(".")) { // Only top-level fields
                    ObjectNode column = objectMapper.createObjectNode();
                    column.put("sourceField", field.getFieldName());
                    column.put("targetColumn", field.getFieldName());
                    column.put("dataType", structuralAnalyzerService.suggestSqlType(field));
                    column.put("nullable", !field.getIsRequired());

                    if (field.getIsArray() ||
                            (field.getDataTypes() != null && field.getDataTypes().toString().contains("object"))) {
                        column.put("requiresTransformation", true);
                        column.put("transformationType", "TO_JSONB");
                    }

                    columns.add(column);
                }
            }

            // Add primary key
            ObjectNode pkColumn = objectMapper.createObjectNode();
            pkColumn.put("sourceField", "_id");
            pkColumn.put("targetColumn", "id");
            pkColumn.put("dataType", "UUID");
            pkColumn.put("nullable", false);
            pkColumn.put("primaryKey", true);
            columns.insert(0, pkColumn); // Add at beginning

            tableMapping.set("columns", columns);
            mappings.add(tableMapping);
        }

        return mappings;
    }

    /**
     * Generates foreign key definitions
     */
    private ArrayNode generateForeignKeys(List<MongoRelationship> relationships) {
        ArrayNode foreignKeys = objectMapper.createArrayNode();

        for (MongoRelationship rel : relationships) {
            if (rel.getConfidence() >= 0.7) { // Only include high-confidence relationships
                ObjectNode fk = objectMapper.createObjectNode();
                fk.put("constraintName", String.format("fk_%s_%s",
                        rel.getSourceCollection(), rel.getSourceField()));
                fk.put("sourceTable", rel.getSourceCollection());
                fk.put("sourceColumn", rel.getSourceField());
                fk.put("targetTable", rel.getTargetCollection());
                fk.put("targetColumn", "id"); // Mapped from _id
                fk.put("onDelete", "CASCADE");
                fk.put("onUpdate", "CASCADE");
                fk.put("confidence", rel.getConfidence());

                foreignKeys.add(fk);
            }
        }

        return foreignKeys;
    }

    /**
     * Generates index suggestions
     */
    private ArrayNode generateIndexSuggestions(List<MongoRelationship> relationships, List<MongoSchemaField> fields) {
        ArrayNode indexes = objectMapper.createArrayNode();
        Set<String> indexedColumns = new HashSet<>();

        // Index all foreign key columns
        for (MongoRelationship rel : relationships) {
            if (rel.getConfidence() >= 0.7) {
                String indexKey = rel.getSourceCollection() + "." + rel.getSourceField();
                if (!indexedColumns.contains(indexKey)) {
                    ObjectNode index = objectMapper.createObjectNode();
                    index.put("indexName", String.format("idx_%s_%s",
                            rel.getSourceCollection(), rel.getSourceField()));
                    index.put("tableName", rel.getSourceCollection());

                    ArrayNode columns = objectMapper.createArrayNode();
                    columns.add(rel.getSourceField());
                    index.set("columns", columns);
                    index.put("type", "BTREE");
                    index.put("reason", "Foreign key reference");

                    indexes.add(index);
                    indexedColumns.add(indexKey);
                }
            }
        }

        // Suggest indexes for high-frequency fields
        Map<String, List<MongoSchemaField>> fieldsByCollection = fields.stream()
                .collect(Collectors.groupingBy(MongoSchemaField::getCollectionName));

        for (Map.Entry<String, List<MongoSchemaField>> entry : fieldsByCollection.entrySet()) {
            for (MongoSchemaField field : entry.getValue()) {
                // Index fields that appear in most documents and aren't already indexed
                if (field.getFrequency() > 0.9 &&
                        !field.getIsArray() &&
                        !"_id".equals(field.getFieldName())) {

                    String indexKey = field.getCollectionName() + "." + field.getFieldName();
                    if (!indexedColumns.contains(indexKey)) {
                        ObjectNode index = objectMapper.createObjectNode();
                        index.put("indexName", String.format("idx_%s_%s",
                                field.getCollectionName(), field.getFieldName()));
                        index.put("tableName", field.getCollectionName());

                        ArrayNode columns = objectMapper.createArrayNode();
                        columns.add(field.getFieldName());
                        index.set("columns", columns);
                        index.put("type", "BTREE");
                        index.put("reason", "High frequency field");

                        indexes.add(index);
                        indexedColumns.add(indexKey);
                    }
                }
            }
        }

        return indexes;
    }

    /**
     * Generates migration steps
     */
    private ArrayNode generateMigrationSteps(
            Map<String, List<MongoSchemaField>> fieldsByCollection,
            List<MongoRelationship> relationships) {

        ArrayNode steps = objectMapper.createArrayNode();

        // Step 1: Create tables
        ObjectNode step1 = objectMapper.createObjectNode();
        step1.put("step", 1);
        step1.put("description", "Create target tables in PostgreSQL");
        step1.put("action", "CREATE_TABLES");
        ArrayNode tables = objectMapper.createArrayNode();
        for (String collection : fieldsByCollection.keySet()) {
            tables.add(collection);
        }
        step1.set("tables", tables);
        steps.add(step1);

        // Step 2: Migrate data
        ObjectNode step2 = objectMapper.createObjectNode();
        step2.put("step", 2);
        step2.put("description", "Migrate data from MongoDB to PostgreSQL");
        step2.put("action", "MIGRATE_DATA");
        step2.put("note", "Transform nested objects and arrays to JSONB");
        steps.add(step2);

        // Step 3: Create foreign keys
        if (!relationships.isEmpty()) {
            ObjectNode step3 = objectMapper.createObjectNode();
            step3.put("step", 3);
            step3.put("description", "Create foreign key constraints");
            step3.put("action", "CREATE_FOREIGN_KEYS");
            step3.put("count", relationships.size());
            steps.add(step3);
        }

        // Step 4: Create indexes
        ObjectNode step4 = objectMapper.createObjectNode();
        step4.put("step", 4);
        step4.put("description", "Create indexes for performance");
        step4.put("action", "CREATE_INDEXES");
        steps.add(step4);

        // Step 5: Validate
        ObjectNode step5 = objectMapper.createObjectNode();
        step5.put("step", 5);
        step5.put("description", "Validate data integrity and row counts");
        step5.put("action", "VALIDATE");
        steps.add(step5);

        return steps;
    }
}
