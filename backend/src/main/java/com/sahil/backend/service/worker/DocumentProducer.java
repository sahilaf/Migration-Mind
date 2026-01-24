package com.sahil.backend.service.worker;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.sahil.backend.model.DocumentBatch;
import com.sahil.backend.model.MigrationMetrics;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

/**
 * Producer that reads documents from MongoDB and pushes batches to the queue
 * Implements cursor-based streaming to handle large collections efficiently
 */
public class DocumentProducer implements Runnable {

    private static final Logger logger = LoggerFactory.getLogger(DocumentProducer.class);

    private final MongoCollection<Document> collection;
    private final BlockingQueue<DocumentBatch> queue;
    private final MigrationMetrics metrics;
    private final int batchSize;
    private final int mongoFetchSize;
    private final String collectionName;
    private final String targetTableName;

    public DocumentProducer(
            MongoCollection<Document> collection,
            BlockingQueue<DocumentBatch> queue,
            MigrationMetrics metrics,
            int batchSize,
            int mongoFetchSize,
            String collectionName,
            String targetTableName) {
        this.collection = collection;
        this.queue = queue;
        this.metrics = metrics;
        this.batchSize = batchSize;
        this.mongoFetchSize = mongoFetchSize;
        this.collectionName = collectionName;
        this.targetTableName = targetTableName;
    }

    @Override
    public void run() {
        logger.info("Producer started for collection: {} -> {}", collectionName, targetTableName);

        MongoCursor<Document> cursor = null;
        try {
            // Create cursor with batch size optimization
            cursor = collection.find()
                    .batchSize(mongoFetchSize)
                    .iterator();

            List<Document> batch = new ArrayList<>(batchSize);
            int batchCount = 0;

            while (cursor.hasNext() && !Thread.currentThread().isInterrupted()) {
                Document doc = cursor.next();
                batch.add(doc);

                // When batch is full, push to queue
                if (batch.size() >= batchSize) {
                    pushBatch(batch, ++batchCount);
                    batch = new ArrayList<>(batchSize);
                }
            }

            // Flush remaining documents
            if (!batch.isEmpty()) {
                pushBatch(batch, ++batchCount);
            }

            logger.info("Producer completed for collection: {} (produced {} batches, {} documents)",
                    collectionName, batchCount, metrics.getDocumentsProduced());

        } catch (InterruptedException e) {
            logger.warn("Producer interrupted for collection: {}", collectionName);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.error("Producer failed for collection: {}", collectionName, e);
            metrics.incrementErrors();
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private void pushBatch(List<Document> batch, int batchNumber) throws InterruptedException {
        DocumentBatch documentBatch = DocumentBatch.of(
                new ArrayList<>(batch), // Create defensive copy
                collectionName,
                targetTableName);

        queue.put(documentBatch);
        metrics.incrementProduced(batch.size());

        if (batchNumber % 10 == 0) {
            logger.debug("Producer pushed batch #{} for {} ({} docs, queue size: {})",
                    batchNumber, collectionName, batch.size(), queue.size());
        }
    }
}
