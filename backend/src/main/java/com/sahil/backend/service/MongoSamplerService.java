package com.sahil.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.sahil.backend.model.DbConnection;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MongoSamplerService {

    @Autowired
    private MongoConnectionService mongoConnectionService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final int DEFAULT_SAMPLE_SIZE = 1000;

    /**
     * Samples documents from a collection
     */
    public List<Document> sampleCollection(DbConnection dbConnection, String collectionName, int sampleSize) {
        try (MongoClient mongoClient = mongoConnectionService.createMongoClient(dbConnection)) {
            MongoDatabase database = mongoClient.getDatabase(dbConnection.getDatabaseName());
            MongoCollection<Document> collection = database.getCollection(collectionName);

            long totalDocs = collection.countDocuments();
            List<Document> samples = new ArrayList<>();

            if (totalDocs <= sampleSize) {
                // If collection is small, get all documents
                collection.find().into(samples);
            } else {
                // Use aggregation $sample for random sampling
                List<Document> pipeline = Arrays.asList(
                        new Document("$sample", new Document("size", sampleSize)));
                collection.aggregate(pipeline).into(samples);
            }

            return samples;
        }
    }

    /**
     * Analyzes field frequency and data types from samples
     */
    public Map<String, FieldInfo> analyzeFields(List<Document> samples) {
        Map<String, FieldInfo> fieldStats = new HashMap<>();
        int totalDocs = samples.size();

        for (Document doc : samples) {
            analyzeDocument(doc, "", fieldStats, totalDocs);
        }

        return fieldStats;
    }

    /**
     * Recursively analyzes document fields
     */
    private void analyzeDocument(Document doc, String prefix, Map<String, FieldInfo> fieldStats, int totalDocs) {
        for (Map.Entry<String, Object> entry : doc.entrySet()) {
            String fieldName = entry.getKey();
            String fieldPath = prefix.isEmpty() ? fieldName : prefix + "." + fieldName;
            Object value = entry.getValue();

            FieldInfo info = fieldStats.getOrDefault(fieldPath, new FieldInfo(fieldPath));
            info.incrementCount();

            // Detect data type
            String dataType = detectDataType(value);
            info.addDataType(dataType);

            // Check if array
            if (value instanceof List) {
                info.setArray(true);
                List<?> list = (List<?>) value;
                if (!list.isEmpty() && list.get(0) instanceof Document) {
                    // Analyze nested documents in array
                    for (Object item : list) {
                        if (item instanceof Document) {
                            analyzeDocument((Document) item, fieldPath + "[]", fieldStats, totalDocs);
                        }
                    }
                }
            } else if (value instanceof Document) {
                // Analyze nested document
                info.setNested(true);
                analyzeDocument((Document) value, fieldPath, fieldStats, totalDocs);
            }

            fieldStats.put(fieldPath, info);
        }
    }

    /**
     * Detects BSON data type
     */
    private String detectDataType(Object value) {
        if (value == null)
            return "null";
        if (value instanceof String)
            return "string";
        if (value instanceof Integer)
            return "int32";
        if (value instanceof Long)
            return "int64";
        if (value instanceof Double)
            return "double";
        if (value instanceof Boolean)
            return "boolean";
        if (value instanceof Date)
            return "date";
        if (value instanceof org.bson.types.ObjectId)
            return "objectId";
        if (value instanceof List)
            return "array";
        if (value instanceof Document)
            return "object";
        if (value instanceof byte[])
            return "binary";
        return "unknown";
    }

    /**
     * Helper class to track field information
     */
    public static class FieldInfo {
        private String fieldPath;
        private int count;
        private Set<String> dataTypes;
        private boolean isArray;
        private boolean isNested;

        public FieldInfo(String fieldPath) {
            this.fieldPath = fieldPath;
            this.count = 0;
            this.dataTypes = new HashSet<>();
            this.isArray = false;
            this.isNested = false;
        }

        public void incrementCount() {
            this.count++;
        }

        public void addDataType(String type) {
            this.dataTypes.add(type);
        }

        public void setArray(boolean array) {
            this.isArray = array;
        }

        public void setNested(boolean nested) {
            this.isNested = nested;
        }

        public String getFieldPath() {
            return fieldPath;
        }

        public int getCount() {
            return count;
        }

        public Set<String> getDataTypes() {
            return dataTypes;
        }

        public boolean isArray() {
            return isArray;
        }

        public boolean isNested() {
            return isNested;
        }

        public double getFrequency(int totalDocs) {
            return (double) count / totalDocs;
        }
    }
}
