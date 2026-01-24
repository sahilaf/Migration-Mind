package com.sahil.backend.repository;

import com.sahil.backend.model.MigrationRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface MigrationRunRepository extends JpaRepository<MigrationRun, UUID> {
    List<MigrationRun> findByMigrationIdOrderByStartedAtDesc(UUID migrationId);
}
