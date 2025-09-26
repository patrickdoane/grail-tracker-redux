package com.d2.grail_server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_jobs")
public class SyncJob {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private SyncJobType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private SyncJobStatus status = SyncJobStatus.IN_PROGRESS;

  @Column(nullable = false)
  private int progress = 0;

  @Column(length = 280)
  private String message;

  @Column(length = 80)
  private String connectorSlug;

  @Column(nullable = false)
  private int retryCount = 0;

  @Column(nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  @Column(nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public SyncJobType getType() {
    return type;
  }

  public void setType(SyncJobType type) {
    this.type = type;
  }

  public SyncJobStatus getStatus() {
    return status;
  }

  public void setStatus(SyncJobStatus status) {
    this.status = status;
  }

  public int getProgress() {
    return progress;
  }

  public void setProgress(int progress) {
    this.progress = progress;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getConnectorSlug() {
    return connectorSlug;
  }

  public void setConnectorSlug(String connectorSlug) {
    this.connectorSlug = connectorSlug;
  }

  public int getRetryCount() {
    return retryCount;
  }

  public void setRetryCount(int retryCount) {
    this.retryCount = retryCount;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
