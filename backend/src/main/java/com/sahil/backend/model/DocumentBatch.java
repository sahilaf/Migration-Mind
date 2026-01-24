package com.sahil.backend.model;

import org.bson.Document;
import java.util.List;

/**
 * Represents a batch of MongoDB documents to be processed
 * Used in the producer-consumer queue for migration
 */
public class DocumentBatch {

    private final List<Document> documents;
    private final String collectionName;
    private final String targetTableName;
    private final boolean isPoison; // Shutdown signal for consumers

    public DocumentBatch(List<Document> documents, String collectionName, String targetTableName, boolean isPoison) {
        this.documents = documents;
        this.collectionName = collectionName;
        this.targetTableName = targetTableName;
        this.isPoison = isPoison;
    }

    /**
     * Creates a poison pill to signal consumers to shut down
     */
    public static DocumentBatch poison() {
        return new DocumentBatch(null, null, null, true);
    }

    /**
     * Creates a regular batch of documents
     */
    public static DocumentBatch of(List<Document> documents, String collectionName, String targetTableName) {
        return new DocumentBatch(documents, collectionName, targetTableName, false);
    }

    public List<Document> getDocuments() {
        return documents;
    }

    public String getCollectionName() {
        return collectionName;
    }

    public String getTargetTableName() {
        return targetTableName;
    }

    public boolean isPoison() {
        return isPoison;
    }

    public int size() {
        return documents != null ? documents.size() : 0;
    }
}
