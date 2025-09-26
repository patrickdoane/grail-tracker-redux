package com.d2.grail_server.dto;

import com.d2.grail_server.model.SyncJobStatus;
import com.d2.grail_server.model.SyncJobType;
import java.time.LocalDateTime;

public class SyncJobResponse {
  private Long id;
  private SyncJobType type;
  private SyncJobStatus status;
  private int progress;
  private String message;
  private String connectorId;
  private int retryCount;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

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

  public String getConnectorId() {
    return connectorId;
  }

  public void setConnectorId(String connectorId) {
    this.connectorId = connectorId;
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
