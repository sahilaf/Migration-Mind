package com.sahil.backend.service;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;
import com.sahil.backend.model.DbConnection;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MongoConnectionService {

    /**
     * Creates a MongoDB client from connection details
     */
    public MongoClient createMongoClient(DbConnection dbConnection) {
        String connectionString = buildConnectionString(dbConnection);

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(connectionString))
                .build();

        return MongoClients.create(settings);
    }

    /**
     * Tests MongoDB connection and returns list of collections
     */
    public List<String> testConnection(DbConnection dbConnection) {
        try (MongoClient mongoClient = createMongoClient(dbConnection)) {
            MongoDatabase database = mongoClient.getDatabase(dbConnection.getDatabaseName());

            // Trigger connection by listing collections
            List<String> collections = new ArrayList<>();
            MongoIterable<String> collectionNames = database.listCollectionNames();
            for (String name : collectionNames) {
                collections.add(name);
            }

            return collections;
        } catch (Exception e) {
            throw new RuntimeException("Failed to connect to MongoDB: " + e.getMessage(), e);
        }
    }

    /**
     * Lists all collections in the database
     */
    public List<String> listCollections(DbConnection dbConnection) {
        try (MongoClient mongoClient = createMongoClient(dbConnection)) {
            MongoDatabase database = mongoClient.getDatabase(dbConnection.getDatabaseName());

            List<String> collections = new ArrayList<>();
            MongoIterable<String> collectionNames = database.listCollectionNames();
            for (String name : collectionNames) {
                collections.add(name);
            }

            return collections;
        }
    }

    /**
     * Gets collection statistics
     */
    public long getCollectionDocumentCount(DbConnection dbConnection, String collectionName) {
        try (MongoClient mongoClient = createMongoClient(dbConnection)) {
            MongoDatabase database = mongoClient.getDatabase(dbConnection.getDatabaseName());
            return database.getCollection(collectionName).countDocuments();
        }
    }

    /**
     * Builds connection string from DbConnection
     */
    private String buildConnectionString(DbConnection dbConnection) {
        // If connectionString is provided, use it
        if (dbConnection.getConnectionString() != null && !dbConnection.getConnectionString().isEmpty()) {
            return dbConnection.getConnectionString();
        }

        // Build connection string from components
        StringBuilder sb = new StringBuilder("mongodb://");

        if (dbConnection.getUsername() != null && !dbConnection.getUsername().isEmpty()) {
            sb.append(dbConnection.getUsername());
            if (dbConnection.getPassword() != null && !dbConnection.getPassword().isEmpty()) {
                sb.append(":").append(dbConnection.getPassword());
            }
            sb.append("@");
        }

        sb.append(dbConnection.getHost() != null ? dbConnection.getHost() : "localhost");
        sb.append(":");
        sb.append(dbConnection.getPort() != null ? dbConnection.getPort() : 27017);
        sb.append("/");
        sb.append(dbConnection.getDatabaseName());

        if (dbConnection.getAuthDatabase() != null && !dbConnection.getAuthDatabase().isEmpty()) {
            sb.append("?authSource=").append(dbConnection.getAuthDatabase());
        }

        return sb.toString();
    }
}
