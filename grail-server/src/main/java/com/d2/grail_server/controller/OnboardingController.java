package com.d2.grail_server.controller;

import com.d2.grail_server.dto.OnboardingTaskResponse;
import com.d2.grail_server.dto.OnboardingTasksResponse;
import com.d2.grail_server.dto.OnboardingTaskUpdateRequest;
import com.d2.grail_server.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {
  private final OnboardingService onboardingService;

  public OnboardingController(OnboardingService onboardingService) {
    this.onboardingService = onboardingService;
  }

  @GetMapping("/tasks")
  public OnboardingTasksResponse getTasks() {
    return onboardingService.getTasks();
  }

  @PostMapping("/tasks/{taskId}")
  public OnboardingTaskResponse updateTask(
      @PathVariable String taskId, @Valid @RequestBody OnboardingTaskUpdateRequest request) {
    return onboardingService.updateTask(taskId, request);
  }
}
