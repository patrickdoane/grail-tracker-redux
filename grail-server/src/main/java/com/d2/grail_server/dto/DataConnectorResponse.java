package com.d2.grail_server.dto;

import com.d2.grail_server.model.DataConnector.StatusVariant;
import java.time.LocalDateTime;

public class DataConnectorResponse {
  private String id;
  private String label;
  private String description;
  private StatusVariant statusVariant;
  private String statusMessage;
  private String lastSyncSummary;
  private String nextSyncSummary;
  private String actionLabel;
  private LocalDateTime updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public StatusVariant getStatusVariant() {
    return statusVariant;
  }

  public void setStatusVariant(StatusVariant statusVariant) {
    this.statusVariant = statusVariant;
  }

  public String getStatusMessage() {
    return statusMessage;
  }

  public void setStatusMessage(String statusMessage) {
    this.statusMessage = statusMessage;
  }

  public String getLastSyncSummary() {
    return lastSyncSummary;
  }

  public void setLastSyncSummary(String lastSyncSummary) {
    this.lastSyncSummary = lastSyncSummary;
  }

  public String getNextSyncSummary() {
    return nextSyncSummary;
  }

  public void setNextSyncSummary(String nextSyncSummary) {
    this.nextSyncSummary = nextSyncSummary;
  }

  public String getActionLabel() {
    return actionLabel;
  }

  public void setActionLabel(String actionLabel) {
    this.actionLabel = actionLabel;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
