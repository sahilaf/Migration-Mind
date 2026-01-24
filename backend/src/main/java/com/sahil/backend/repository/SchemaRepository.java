package com.sahil.backend.repository;

import com.sahil.backend.model.Schema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchemaRepository extends JpaRepository<Schema, UUID> {
    List<Schema> findByMigrationId(UUID migrationId);

    Schema findFirstByMigrationIdOrderByCreatedAtDesc(UUID migrationId);
}
