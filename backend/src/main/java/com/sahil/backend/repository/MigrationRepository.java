package com.sahil.backend.repository;

import com.sahil.backend.model.Migration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MigrationRepository extends JpaRepository<Migration, UUID> {
    List<Migration> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Migration> findByUserId(UUID userId);

    Optional<Migration> findByUserIdAndConnectionHash(UUID userId, String connectionHash);
}
