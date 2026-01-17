package com.sahil.backend.service;

import com.sahil.backend.model.MongoRelationship;
import com.sahil.backend.model.MongoSchemaField;
import com.sahil.backend.repository.MongoRelationshipRepository;
import com.sahil.backend.repository.MongoSchemaFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class RelationshipDetectorService {

    @Autowired
    private MongoSchemaFieldRepository mongoSchemaFieldRepository;

    @Autowired
    private MongoRelationshipRepository mongoRelationshipRepository;

    // Patterns for detecting foreign key naming conventions
    private static final Pattern UNDERSCORE_ID_PATTERN = Pattern.compile("(.+)_id$");
    private static final Pattern CAMEL_CASE_ID_PATTERN = Pattern.compile("(.+)Id$");
    private static final Pattern PLURAL_PATTERN = Pattern.compile("(.+)s$");

    /**
     * Detects relationships across all collections
     */
    public List<MongoRelationship> detectRelationships(UUID schemaId, List<String> collectionNames) {
        List<MongoRelationship> relationships = new ArrayList<>();
        List<MongoSchemaField> allFields = mongoSchemaFieldRepository.findBySchemaId(schemaId);

        // Group fields by collection
        Map<String, List<MongoSchemaField>> fieldsByCollection = new HashMap<>();
        for (MongoSchemaField field : allFields) {
            fieldsByCollection
                    .computeIfAbsent(field.getCollectionName(), k -> new ArrayList<>())
                    .add(field);
        }

        // Detect relationships for each collection
        for (String sourceCollection : collectionNames) {
            List<MongoSchemaField> fields = fieldsByCollection.get(sourceCollection);
            if (fields == null)
                continue;

            for (MongoSchemaField field : fields) {
                // Check for ObjectId references
                if (isObjectIdField(field)) {
                    MongoRelationship rel = detectObjectIdRelationship(
                            schemaId, sourceCollection, field, collectionNames);
                    if (rel != null) {
                        relationships.add(rel);
                    }
                }

                // Check for naming convention references
                MongoRelationship rel = detectNamingConventionRelationship(
                        schemaId, sourceCollection, field, collectionNames);
                if (rel != null) {
                    relationships.add(rel);
                }
            }
        }

        // Save all relationships
        return mongoRelationshipRepository.saveAll(relationships);
    }

    /**
     * Detects if field is an ObjectId type
     */
    private boolean isObjectIdField(MongoSchemaField field) {
        if (field.getDataTypes() == null)
            return false;

        for (int i = 0; i < field.getDataTypes().size(); i++) {
            if ("objectId".equals(field.getDataTypes().get(i).asText())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Detects relationship based on ObjectId type and naming
     */
    private MongoRelationship detectObjectIdRelationship(
            UUID schemaId,
            String sourceCollection,
            MongoSchemaField field,
            List<String> collectionNames) {

        String fieldName = field.getFieldName();

        // Skip _id field
        if ("_id".equals(fieldName)) {
            return null;
        }

        String targetCollection = inferTargetCollection(fieldName, collectionNames);
        if (targetCollection != null) {
            return new MongoRelationship(
                    schemaId,
                    sourceCollection,
                    fieldName,
                    targetCollection,
                    "_id",
                    "ONE_TO_MANY",
                    0.9, // High confidence for ObjectId + naming match
                    "OBJECTID");
        }

        return null;
    }

    /**
     * Detects relationship based on naming conventions
     */
    private MongoRelationship detectNamingConventionRelationship(
            UUID schemaId,
            String sourceCollection,
            MongoSchemaField field,
            List<String> collectionNames) {

        String fieldName = field.getFieldName();
        String targetCollection = inferTargetCollection(fieldName, collectionNames);

        if (targetCollection != null && !isObjectIdField(field)) {
            // Lower confidence for non-ObjectId fields
            return new MongoRelationship(
                    schemaId,
                    sourceCollection,
                    fieldName,
                    targetCollection,
                    "_id",
                    "ONE_TO_MANY",
                    0.6, // Medium confidence for naming convention only
                    "NAMING_CONVENTION");
        }

        return null;
    }

    /**
     * Infers target collection from field name
     */
    private String inferTargetCollection(String fieldName, List<String> collectionNames) {
        // Try underscore pattern: user_id -> user
        java.util.regex.Matcher underscoreMatcher = UNDERSCORE_ID_PATTERN.matcher(fieldName);
        if (underscoreMatcher.matches()) {
            String baseName = underscoreMatcher.group(1);
            String targetCollection = findMatchingCollection(baseName, collectionNames);
            if (targetCollection != null)
                return targetCollection;
        }

        // Try camelCase pattern: userId -> user
        java.util.regex.Matcher camelCaseMatcher = CAMEL_CASE_ID_PATTERN.matcher(fieldName);
        if (camelCaseMatcher.matches()) {
            String baseName = camelCaseMatcher.group(1).toLowerCase();
            String targetCollection = findMatchingCollection(baseName, collectionNames);
            if (targetCollection != null)
                return targetCollection;
        }

        return null;
    }

    /**
     * Finds matching collection name (handles singular/plural)
     */
    private String findMatchingCollection(String baseName, List<String> collectionNames) {
        // Direct match
        if (collectionNames.contains(baseName)) {
            return baseName;
        }

        // Try plural form
        String plural = baseName + "s";
        if (collectionNames.contains(plural)) {
            return plural;
        }

        // Try singular (remove 's')
        java.util.regex.Matcher pluralMatcher = PLURAL_PATTERN.matcher(baseName);
        if (pluralMatcher.matches()) {
            String singular = pluralMatcher.group(1);
            if (collectionNames.contains(singular)) {
                return singular;
            }
        }

        return null;
    }

    /**
     * Calculates relationship confidence score
     */
    public double calculateConfidence(MongoRelationship relationship) {
        // Already set in detection methods, but can be refined with additional
        // heuristics
        return relationship.getConfidence();
    }
}
