package com.sahil.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sahil.backend.model.*;
import com.sahil.backend.repository.MongoRelationshipRepository;
import com.sahil.backend.repository.MongoSchemaFieldRepository;
import com.sahil.backend.repository.SchemaRepository;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MongoAnalysisOrchestratorService {

    @Autowired
    private MongoConnectionService mongoConnectionService;

    @Autowired
    private MongoSamplerService mongoSamplerService;

    @Autowired
    private StructuralAnalyzerService structuralAnalyzerService;

    @Autowired
    private RelationshipDetectorService relationshipDetectorService;

    @Autowired
    private RiskAnalyzerService riskAnalyzerService;

    @Autowired
    private MigrationPlanGeneratorService migrationPlanGeneratorService;

    @Autowired
    private SchemaRepository schemaRepository;

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    @Autowired
    private MongoRelationshipRepository mongoRelationshipRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Orchestrates the complete MongoDB analysis pipeline
     */
    public AnalysisResult runCompleteAnalysis(UUID migrationId, DbConnection dbConnection, int sampleSize) {
        AnalysisResult result = new AnalysisResult();

        try {
            // Step 1: Test connection and get collections
            List<String> collections = mongoConnectionService.testConnection(dbConnection);
            result.setCollections(collections);

            // Create schema record
            Schema schema = new Schema(migrationId, objectMapper.createObjectNode());
            schema = schemaRepository.save(schema);
            UUID schemaId = schema.getId();
            result.setSchemaId(schemaId);

            // Step 2: Sample and analyze each collection
            for (String collectionName : collections) {
                // Sample documents
                List<Document> samples = mongoSamplerService.sampleCollection(
                        dbConnection, collectionName, sampleSize);

                // Analyze structure
                Map<String, MongoSamplerService.FieldInfo> fieldStats = mongoSamplerService.analyzeFields(samples);

                // Save schema fields
                List<MongoSchemaField> schemaFields = structuralAnalyzerService.analyzeCollectionStructure(
                        schemaId, collectionName, fieldStats, samples.size());

                result.addCollectionAnalysis(collectionName, schemaFields.size());
            }

            // Step 3: Detect relationships
            List<MongoRelationship> relationships = relationshipDetectorService.detectRelationships(
                    schemaId, collections);
            result.setRelationshipCount(relationships.size());

            // Step 4: Analyze risks
            List<MigrationRisk> risks = riskAnalyzerService.analyzeRisks(migrationId, schemaId);
            result.setRiskCount(risks.size());

            // Step 5: Generate migration plan
            ObjectNode migrationPlan = migrationPlanGeneratorService.generateMigrationPlan(schemaId);
            result.setMigrationPlan(migrationPlan);

            // Update schema with complete analysis
            schema.setSchemaJson(structuralAnalyzerService.buildSchemaRepresentation(
                    mongoSchemaFieldRepository.findBySchemaId(schemaId)));
            schema.setAnalyzed(true);
            schemaRepository.save(schema);

            result.setSuccess(true);
            result.setMessage("Analysis completed successfully");

        } catch (Exception e) {
            result.setSuccess(false);
            result.setMessage("Analysis failed: " + e.getMessage());
            result.setError(e.getMessage());
        }

        return result;
    }

    /**
     * Result object for analysis
     */
    public static class AnalysisResult {
        private boolean success;
        private String message;
        private String error;
        private UUID schemaId;
        private List<String> collections;
        private Map<String, Integer> collectionFieldCounts = new java.util.HashMap<>();
        private int relationshipCount;
        private int riskCount;
        private ObjectNode migrationPlan;

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public UUID getSchemaId() {
            return schemaId;
        }

        public void setSchemaId(UUID schemaId) {
            this.schemaId = schemaId;
        }

        public List<String> getCollections() {
            return collections;
        }

        public void setCollections(List<String> collections) {
            this.collections = collections;
        }

        public Map<String, Integer> getCollectionFieldCounts() {
            return collectionFieldCounts;
        }

        public void addCollectionAnalysis(String collection, int fieldCount) {
            this.collectionFieldCounts.put(collection, fieldCount);
        }

        public int getRelationshipCount() {
            return relationshipCount;
        }

        public void setRelationshipCount(int relationshipCount) {
            this.relationshipCount = relationshipCount;
        }

        public int getRiskCount() {
            return riskCount;
        }

        public void setRiskCount(int riskCount) {
            this.riskCount = riskCount;
        }

        public ObjectNode getMigrationPlan() {
            return migrationPlan;
        }

        public void setMigrationPlan(ObjectNode migrationPlan) {
            this.migrationPlan = migrationPlan;
        }
    }
}
