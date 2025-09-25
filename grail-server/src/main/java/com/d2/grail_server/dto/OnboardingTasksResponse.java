package com.d2.grail_server.dto;

import java.util.List;

public class OnboardingTasksResponse {
  private List<OnboardingTaskResponse> tasks;
  private int completionPercent;

  public List<OnboardingTaskResponse> getTasks() {
    return tasks;
  }

  public void setTasks(List<OnboardingTaskResponse> tasks) {
    this.tasks = tasks;
  }

  public int getCompletionPercent() {
    return completionPercent;
  }

  public void setCompletionPercent(int completionPercent) {
    this.completionPercent = completionPercent;
  }
}
