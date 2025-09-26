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
@Table(name = "data_connectors")
public class DataConnector {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 80)
  private String slug;

  @Column(nullable = false, length = 120)
  private String label;

  @Column(length = 280)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private StatusVariant statusVariant = StatusVariant.INFO;

  @Column(nullable = false, length = 80)
  private String statusMessage;

  @Column(length = 140)
  private String lastSyncSummary;

  @Column(length = 140)
  private String nextSyncSummary;

  @Column(nullable = false, length = 80)
  private String actionLabel;

  @Column(nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();

  @Column(nullable = false)
  private int displayOrder = 0;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
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

  public int getDisplayOrder() {
    return displayOrder;
  }

  public void setDisplayOrder(int displayOrder) {
    this.displayOrder = displayOrder;
  }

  public enum StatusVariant {
    NEUTRAL,
    SUCCESS,
    WARNING,
    DANGER,
    INFO
  }
}
