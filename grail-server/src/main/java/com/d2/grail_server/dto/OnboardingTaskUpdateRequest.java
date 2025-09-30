package com.d2.grail_server.dto;

import jakarta.validation.constraints.NotNull;

public class OnboardingTaskUpdateRequest {
  @NotNull private Boolean completed;

  public Boolean getCompleted() {
    return completed;
  }

  public void setCompleted(Boolean completed) {
    this.completed = completed;
  }
}
