package com.d2.grail_server.service;

import com.d2.grail_server.dto.SyncJobResponse;
import com.d2.grail_server.model.SyncJob;
import com.d2.grail_server.model.SyncJobStatus;
import com.d2.grail_server.model.SyncJobType;
import com.d2.grail_server.repository.SyncJobRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SyncJobService {
  private final SyncJobRepository syncJobRepository;

  public SyncJobService(SyncJobRepository syncJobRepository) {
    this.syncJobRepository = syncJobRepository;
  }

  public SyncJob startJob(SyncJobType type, String connectorSlug, String message) {
    SyncJob job = new SyncJob();
    job.setType(type);
    job.setConnectorSlug(connectorSlug);
    job.setStatus(SyncJobStatus.IN_PROGRESS);
    job.setProgress(5);
    job.setMessage(message);
    job.setCreatedAt(LocalDateTime.now());
    job.setUpdatedAt(LocalDateTime.now());
    return syncJobRepository.save(job);
  }

  public SyncJob completeJob(SyncJob job, String message) {
    job.setStatus(SyncJobStatus.COMPLETED);
    job.setProgress(100);
    job.setMessage(message);
    job.setUpdatedAt(LocalDateTime.now());
    return syncJobRepository.save(job);
  }

  public SyncJob failJob(SyncJob job, String message) {
    job.setStatus(SyncJobStatus.FAILED);
    job.setProgress(100);
    job.setMessage(message);
    job.setRetryCount(job.getRetryCount() + 1);
    job.setUpdatedAt(LocalDateTime.now());
    return syncJobRepository.save(job);
  }

  public Optional<SyncJob> getJob(Long id) {
    return syncJobRepository.findById(id);
  }

  public SyncJobResponse toResponse(SyncJob job) {
    SyncJobResponse response = new SyncJobResponse();
    response.setId(job.getId());
    response.setType(job.getType());
    response.setStatus(job.getStatus());
    response.setProgress(job.getProgress());
    response.setMessage(job.getMessage());
    response.setConnectorId(job.getConnectorSlug());
    response.setRetryCount(job.getRetryCount());
    response.setCreatedAt(job.getCreatedAt());
    response.setUpdatedAt(job.getUpdatedAt());
    return response;
  }

  public Optional<SyncJobResponse> findLatestCompleted(SyncJobType type) {
    return syncJobRepository
        .findTopByTypeAndStatusOrderByUpdatedAtDesc(type, SyncJobStatus.COMPLETED)
        .map(this::toResponse);
  }
}
