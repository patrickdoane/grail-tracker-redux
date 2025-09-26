package com.d2.grail_server.repository;

import com.d2.grail_server.model.SyncJob;
import com.d2.grail_server.model.SyncJobStatus;
import com.d2.grail_server.model.SyncJobType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncJobRepository extends JpaRepository<SyncJob, Long> {
  Optional<SyncJob> findTopByTypeAndStatusOrderByUpdatedAtDesc(SyncJobType type, SyncJobStatus status);
}
