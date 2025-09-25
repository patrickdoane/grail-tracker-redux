package com.d2.grail_server.service;

import com.d2.grail_server.dto.OnboardingTaskResponse;
import com.d2.grail_server.dto.OnboardingTasksResponse;
import com.d2.grail_server.dto.OnboardingTaskUpdateRequest;
import com.d2.grail_server.model.OnboardingTaskState;
import com.d2.grail_server.model.SyncJobType;
import com.d2.grail_server.model.UserPreferences;
import com.d2.grail_server.model.UserProfile;
import com.d2.grail_server.repository.OnboardingTaskStateRepository;
import com.d2.grail_server.repository.UserPreferencesRepository;
import com.d2.grail_server.repository.UserProfileRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OnboardingService {
  private final UserProfileRepository userProfileRepository;
  private final UserPreferencesRepository userPreferencesRepository;
  private final OnboardingTaskStateRepository onboardingTaskStateRepository;
  private final SyncJobService syncJobService;

  public OnboardingService(
      UserProfileRepository userProfileRepository,
      UserPreferencesRepository userPreferencesRepository,
      OnboardingTaskStateRepository onboardingTaskStateRepository,
      SyncJobService syncJobService) {
    this.userProfileRepository = userProfileRepository;
    this.userPreferencesRepository = userPreferencesRepository;
    this.onboardingTaskStateRepository = onboardingTaskStateRepository;
    this.syncJobService = syncJobService;
  }

  public OnboardingTasksResponse getTasks() {
    UserProfile profile =
        userProfileRepository
            .findTopByOrderByUpdatedAtDesc()
            .orElseGet(
                () -> {
                  UserProfile created = new UserProfile();
                  created.setDisplayName("Grail Seeker");
                  created.setTagline("Tracking every last drop.");
                  created.setEmail("grail@example.com");
                  created.setTimezone("UTC");
                  created.setUpdatedAt(LocalDateTime.now());
                  return userProfileRepository.save(created);
                });

    UserPreferences preferences =
        userPreferencesRepository.findByProfile(profile).orElse(null);

    Map<String, OnboardingTaskState> overrides =
        onboardingTaskStateRepository.findAll().stream()
            .collect(Collectors.toMap(OnboardingTaskState::getTaskId, Function.identity()));

    boolean profileBasicsComplete =
        profile.getDisplayName() != null
            && !profile.getDisplayName().isBlank()
            && profile.getEmail() != null
            && !profile.getEmail().isBlank();

    boolean syncPreferencesComplete =
        preferences != null && preferences.isShareProfile() && preferences.isSessionPresence();

    boolean importComplete = syncJobService.findLatestCompleted(SyncJobType.IMPORT).isPresent();
    boolean exportComplete = syncJobService.findLatestCompleted(SyncJobType.EXPORT).isPresent();

    List<OnboardingTaskResponse> tasks = new ArrayList<>();

    tasks.add(
        buildTask(
            "profile-basics",
            "Complete profile basics",
            "Confirm display name, contact email, and preferred timezone.",
            profileBasicsComplete,
            overrides));

    tasks.add(
        buildTask(
            "sync-preferences",
            "Review sync preferences",
            "Decide how cloud backups and local exports should coordinate.",
            syncPreferencesComplete,
            overrides));

    tasks.add(
        buildTask(
            "import-history",
            "Import existing grail history",
            "Bring in CSV exports or save files to seed the persistence layer.",
            importComplete,
            overrides));

    tasks.add(
        buildTask(
            "share-progress",
            "Share a progress snapshot",
            "Generate a summary card to celebrate milestones with friends.",
            exportComplete,
            overrides));

    int completedCount = (int) tasks.stream().filter(OnboardingTaskResponse::isCompleted).count();
    int percent = Math.round(((float) completedCount / Math.max(tasks.size(), 1)) * 100);

    OnboardingTasksResponse response = new OnboardingTasksResponse();
    response.setTasks(tasks);
    response.setCompletionPercent(percent);
    return response;
  }

  public OnboardingTaskResponse updateTask(String taskId, OnboardingTaskUpdateRequest request) {
    OnboardingTaskState state =
        onboardingTaskStateRepository.findByTaskId(taskId).orElseGet(OnboardingTaskState::new);
    state.setTaskId(taskId);
    state.setCompleted(Boolean.TRUE.equals(request.getCompleted()));
    state.setUpdatedAt(LocalDateTime.now());
    onboardingTaskStateRepository.save(state);

    return getTasks().getTasks().stream()
        .filter(task -> task.getId().equals(taskId))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));
  }

  private OnboardingTaskResponse buildTask(
      String id,
      String label,
      String description,
      boolean signalCompleted,
      Map<String, OnboardingTaskState> overrides) {
    OnboardingTaskState state = overrides.get(id);
    boolean manualCompleted = state != null && state.isCompleted();

    OnboardingTaskResponse response = new OnboardingTaskResponse();
    response.setId(id);
    response.setLabel(label);
    response.setDescription(description);
    response.setDerivedFromSignals(signalCompleted);
    response.setCompleted(signalCompleted || manualCompleted);
    return response;
  }
}
