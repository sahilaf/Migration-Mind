package com.sahil.backend.repository;

import com.sahil.backend.model.MigrationRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MigrationRiskRepository extends JpaRepository<MigrationRisk, UUID> {
    List<MigrationRisk> findByMigrationId(UUID migrationId);

    List<MigrationRisk> findByMigrationIdAndSeverity(UUID migrationId, String severity);

    List<MigrationRisk> findByMigrationIdOrderBySeverityDesc(UUID migrationId);
}
