package com.d2.grail_server.dto;

public class OnboardingTaskResponse {
  private String id;
  private String label;
  private String description;
  private boolean completed;
  private boolean derivedFromSignals;

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

  public boolean isCompleted() {
    return completed;
  }

  public void setCompleted(boolean completed) {
    this.completed = completed;
  }

  public boolean isDerivedFromSignals() {
    return derivedFromSignals;
  }

  public void setDerivedFromSignals(boolean derivedFromSignals) {
    this.derivedFromSignals = derivedFromSignals;
  }
}
