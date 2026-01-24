package com.sahil.backend.repository;

import com.sahil.backend.model.MongoSchemaField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MongoSchemaFieldRepository extends JpaRepository<MongoSchemaField, UUID> {
    List<MongoSchemaField> findBySchemaId(UUID schemaId);

    List<MongoSchemaField> findByCollectionName(String collectionName);

    List<MongoSchemaField> findBySchemaIdAndCollectionName(UUID schemaId, String collectionName);
}
