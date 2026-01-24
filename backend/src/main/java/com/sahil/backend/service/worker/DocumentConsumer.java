package com.sahil.backend.service.worker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sahil.backend.model.DocumentBatch;
import com.sahil.backend.model.MigrationMetrics;
import com.sahil.backend.model.MigrationProgress;
import com.sahil.backend.repository.MigrationProgressRepository;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;

/**
 * Consumer that polls document batches from the queue and writes to PostgreSQL
 * Implements retry logic and error handling for fault tolerance
 */
public class DocumentConsumer implements Runnable {

    private static final Logger logger = LoggerFactory.getLogger(DocumentConsumer.class);

    private final BlockingQueue<DocumentBatch> queue;
    private final JdbcTemplate jdbcTemplate;
    private final JsonNode columnMapping;
    private final String targetTableName;
    private final MigrationMetrics metrics;
    private final ObjectMapper objectMapper;
    private final int maxRetries;
    private final long retryDelayMs;
    private final MigrationProgressRepository progressRepository;
    private final UUID progressId;
    private final int consumerId;

    public DocumentConsumer(
            BlockingQueue<DocumentBatch> queue,
            JdbcTemplate jdbcTemplate,
            JsonNode columnMapping,
            String targetTableName,
            MigrationMetrics metrics,
            ObjectMapper objectMapper,
            int maxRetries,
            long retryDelayMs,
            MigrationProgressRepository progressRepository,
            UUID progressId,
            int consumerId) {
        this.queue = queue;
        this.jdbcTemplate = jdbcTemplate;
        this.columnMapping = columnMapping;
        this.targetTableName = targetTableName;
        this.metrics = metrics;
        this.objectMapper = objectMapper;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
        this.progressRepository = progressRepository;
        this.progressId = progressId;
        this.consumerId = consumerId;
    }

    @Override
    public void run() {
        logger.info("Consumer #{} started for table: {}", consumerId, targetTableName);

        int batchesProcessed = 0;

        try {
            while (!Thread.currentThread().isInterrupted()) {
                DocumentBatch batch = queue.take();

                // Check for poison pill (shutdown signal)
                if (batch.isPoison()) {
                    logger.info("Consumer #{} received poison pill, shutting down", consumerId);
                    queue.put(batch); // Re-queue for other consumers
                    break;
                }

                // Process the batch with retry logic
                processBatchWithRetry(batch);
                batchesProcessed++;

                // Log progress periodically
                if (batchesProcessed % 10 == 0) {
                    logger.debug("Consumer #{} processed {} batches (throughput: {:.2f} docs/sec)",
                            consumerId, batchesProcessed, metrics.getThroughputPerSecond());
                }
            }

            logger.info("Consumer #{} completed for table: {} (processed {} batches)",
                    consumerId, targetTableName, batchesProcessed);

        } catch (InterruptedException e) {
            logger.warn("Consumer #{} interrupted", consumerId);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.error("Consumer #{} failed unexpectedly", consumerId, e);
        }
    }

    private void processBatchWithRetry(DocumentBatch batch) {
        int attempt = 0;
        Exception lastException = null;

        while (attempt < maxRetries) {
            try {
                processBatch(batch);
                return; // Success

            } catch (Exception e) {
                attempt++;
                lastException = e;

                if (attempt < maxRetries) {
                    logger.warn("Consumer #{} batch processing failed (attempt {}/{}), retrying in {}ms",
                            consumerId, attempt, maxRetries, retryDelayMs * attempt);

                    try {
                        Thread.sleep(retryDelayMs * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry delay", ie);
                    }
                }
            }
        }

        // All retries exhausted
        logger.error("Consumer #{} failed to process batch after {} attempts for table: {}",
                consumerId, maxRetries, targetTableName, lastException);
        metrics.incrementErrors();
    }

    private void processBatch(DocumentBatch batch) {
        String sql = buildInsertSql();
        List<Object[]> args = transformDocuments(batch.getDocuments());

        // Execute batch insert
        jdbcTemplate.batchUpdate(sql, args);

        // Update metrics
        metrics.incrementConsumed(batch.size());

        // Update progress in database
        updateProgress(batch.size());
    }

    private String buildInsertSql() {
        StringBuilder sql = new StringBuilder("INSERT INTO ");
        sql.append(targetTableName).append(" (");

        List<String> cols = new ArrayList<>();
        List<String> placeholders = new ArrayList<>();

        // PostgreSQL reserved keywords that need quoting
        Set<String> reservedKeywords = new HashSet<>();
        reservedKeywords.add("user");
        reservedKeywords.add("order");
        reservedKeywords.add("group");
        reservedKeywords.add("table");
        reservedKeywords.add("index");
        reservedKeywords.add("select");
        reservedKeywords.add("insert");
        reservedKeywords.add("update");
        reservedKeywords.add("delete");
        reservedKeywords.add("from");
        reservedKeywords.add("where");
        reservedKeywords.add("join");
        reservedKeywords.add("left");
        reservedKeywords.add("right");
        reservedKeywords.add("inner");
        reservedKeywords.add("outer");
        reservedKeywords.add("on");
        reservedKeywords.add("as");
        reservedKeywords.add("and");
        reservedKeywords.add("or");
        reservedKeywords.add("not");
        reservedKeywords.add("null");
        reservedKeywords.add("true");
        reservedKeywords.add("false");
        reservedKeywords.add("default");
        reservedKeywords.add("primary");
        reservedKeywords.add("foreign");
        reservedKeywords.add("key");
        reservedKeywords.add("references");
        reservedKeywords.add("constraint");
        reservedKeywords.add("check");
        reservedKeywords.add("unique");

        if (columnMapping.isArray()) {
            for (JsonNode col : columnMapping) {
                String colName = col.get("targetColumn").asText();
                String sourceField = col.get("sourceField").asText();
                String dataType = col.has("dataType") ? col.get("dataType").asText() : "VARCHAR";
                boolean requiresTransformation = col.has("requiresTransformation")
                        && col.get("requiresTransformation").asBoolean();

                // Quote column name if it's a reserved keyword
                if (reservedKeywords.contains(colName.toLowerCase())) {
                    cols.add("\"" + colName + "\"");
                } else {
                    cols.add(colName);
                }

                // For JSONB columns, cast the placeholder
                // BUT: Don't cast ObjectId fields - they should be plain TEXT
                // Skip: _id, userId, orderId, productId, etc.
                boolean isObjectIdField = "_id".equals(sourceField) || sourceField.endsWith("Id");
                if ((dataType.equalsIgnoreCase("JSONB") || requiresTransformation) && !isObjectIdField) {
                    placeholders.add("?::jsonb");
                } else {
                    placeholders.add("?");
                }
            }
        }

        sql.append(String.join(", ", cols));
        sql.append(") VALUES (");
        sql.append(String.join(", ", placeholders));
        sql.append(")");

        return sql.toString();
    }

    private List<Object[]> transformDocuments(List<Document> documents) {
        List<Object[]> result = new ArrayList<>();

        for (Document doc : documents) {
            result.add(transformDocument(doc));
        }

        return result;
    }

    private Object[] transformDocument(Document doc) {
        List<Object> values = new ArrayList<>();

        if (columnMapping.isArray()) {
            for (JsonNode colMap : columnMapping) {
                String sourceField = colMap.get("sourceField").asText();
                String targetType = colMap.has("dataType") ? colMap.get("dataType").asText() : "VARCHAR";
                boolean isTransform = colMap.has("requiresTransformation")
                        && colMap.get("requiresTransformation").asBoolean();

                Object val = null;

                // Handle _id specially
                if ("_id".equals(sourceField)) {
                    if (targetType.equalsIgnoreCase("UUID")) {
                        try {
                            val = java.util.UUID.nameUUIDFromBytes(doc.getObjectId("_id").toByteArray());
                        } catch (Exception e) {
                            val = doc.get(sourceField);
                        }
                    } else {
                        // For both VARCHAR and JSONB, use the plain 24-character ObjectId string
                        // PostgreSQL will handle the conversion to JSONB if needed
                        val = doc.getObjectId("_id").toString();
                    }
                } else {
                    val = doc.get(sourceField);
                }

                // Convert ObjectIds to strings before JSON serialization
                if (val instanceof org.bson.types.ObjectId) {
                    String objectIdStr = ((org.bson.types.ObjectId) val).toString();
                    // If target is JSONB, serialize as JSON string
                    if (targetType.equalsIgnoreCase("JSONB")) {
                        try {
                            val = objectMapper.writeValueAsString(objectIdStr);
                        } catch (Exception e) {
                            val = "\"" + objectIdStr + "\"";
                        }
                    } else {
                        val = objectIdStr;
                    }
                } else if (val instanceof Document) {
                    // Convert ObjectIds in nested documents
                    val = convertObjectIdsToStrings((Document) val);
                    val = ((Document) val).toJson();
                } else if (isTransform && !"_id".equals(sourceField)) {
                    // Transform nested objects to JSON (but not if already handled above)
                    try {
                        val = convertObjectIdsInValue(val);
                        val = objectMapper.writeValueAsString(val);
                    } catch (Exception e) {
                        val = "{}";
                    }
                } else if (val != null && targetType.equalsIgnoreCase("JSONB") && !"_id".equals(sourceField)) {
                    // Convert arrays and objects to JSON strings for JSONB columns
                    if (val instanceof List || val.getClass().isArray()) {
                        try {
                            val = convertObjectIdsInValue(val);
                            val = objectMapper.writeValueAsString(val);
                        } catch (Exception e) {
                            val = "[]";
                        }
                    }
                }

                // Handle null values for non-nullable columns
                if (val == null && colMap.has("nullable") && !colMap.get("nullable").asBoolean()) {
                    // Could set default values here
                }

                values.add(val);
            }
        }

        return values.toArray();
    }

    private void updateProgress(int documentsProcessed) {
        try {
            MigrationProgress progress = progressRepository.findById(progressId).orElse(null);
            if (progress != null) {
                long newTotal = progress.getRowsProcessed() + documentsProcessed;
                progress.setRowsProcessed(newTotal);
                progressRepository.save(progress);
            }
        } catch (Exception e) {
            logger.warn("Failed to update progress for consumer #{}", consumerId, e);
        }
    }

    /**
     * Recursively convert ObjectIds to strings in a Document
     */
    private Document convertObjectIdsToStrings(Document doc) {
        Document result = new Document();
        for (String key : doc.keySet()) {
            Object value = doc.get(key);
            if (value instanceof org.bson.types.ObjectId) {
                result.put(key, ((org.bson.types.ObjectId) value).toString());
            } else if (value instanceof Document) {
                result.put(key, convertObjectIdsToStrings((Document) value));
            } else if (value instanceof List) {
                result.put(key, convertObjectIdsInList((List<?>) value));
            } else {
                result.put(key, value);
            }
        }
        return result;
    }

    /**
     * Convert ObjectIds to strings in any value type
     */
    private Object convertObjectIdsInValue(Object value) {
        if (value instanceof org.bson.types.ObjectId) {
            return ((org.bson.types.ObjectId) value).toString();
        } else if (value instanceof Document) {
            return convertObjectIdsToStrings((Document) value);
        } else if (value instanceof List) {
            return convertObjectIdsInList((List<?>) value);
        } else if (value instanceof Map) {
            return convertObjectIdsInMap((Map<?, ?>) value);
        }
        return value;
    }

    /**
     * Convert ObjectIds to strings in a List
     */
    private List<Object> convertObjectIdsInList(List<?> list) {
        List<Object> result = new ArrayList<>();
        for (Object item : list) {
            result.add(convertObjectIdsInValue(item));
        }
        return result;
    }

    /**
     * Convert ObjectIds to strings in a Map
     */
    private Map<String, Object> convertObjectIdsInMap(Map<?, ?> map) {
        Map<String, Object> result = new java.util.HashMap<>();
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            result.put(entry.getKey().toString(), convertObjectIdsInValue(entry.getValue()));
        }
        return result;
    }
}
