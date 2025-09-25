package com.d2.grail_server.repository;

import com.d2.grail_server.model.OnboardingTaskState;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingTaskStateRepository extends JpaRepository<OnboardingTaskState, Long> {
  Optional<OnboardingTaskState> findByTaskId(String taskId);
}
