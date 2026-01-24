package com.sahil.backend.repository;

import com.sahil.backend.model.MigrationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MigrationPlanRepository extends JpaRepository<MigrationPlan, UUID> {
    List<MigrationPlan> findByMigrationId(UUID migrationId);

    MigrationPlan findFirstByMigrationIdOrderByCreatedAtDesc(UUID migrationId);
}
