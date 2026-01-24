package com.sahil.backend.repository;

import com.sahil.backend.model.MongoRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MongoRelationshipRepository extends JpaRepository<MongoRelationship, UUID> {
    List<MongoRelationship> findBySchemaId(UUID schemaId);

    List<MongoRelationship> findBySourceCollection(String sourceCollection);

    List<MongoRelationship> findByTargetCollection(String targetCollection);
}
