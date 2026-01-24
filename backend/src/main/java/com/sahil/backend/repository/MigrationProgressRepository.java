package com.sahil.backend.repository;

import com.sahil.backend.model.MigrationProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MigrationProgressRepository extends JpaRepository<MigrationProgress, UUID> {
    List<MigrationProgress> findByRunId(UUID runId);
}
