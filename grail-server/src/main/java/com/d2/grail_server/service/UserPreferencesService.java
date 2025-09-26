package com.d2.grail_server.service;

import com.d2.grail_server.dto.UserPreferencesRequest;
import com.d2.grail_server.dto.UserPreferencesResponse;
import com.d2.grail_server.model.UserPreferences;
import com.d2.grail_server.model.UserProfile;
import com.d2.grail_server.repository.UserPreferencesRepository;
import com.d2.grail_server.repository.UserProfileRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserPreferencesService {
  private final UserProfileRepository userProfileRepository;
  private final UserPreferencesRepository userPreferencesRepository;

  public UserPreferencesService(
      UserProfileRepository userProfileRepository,
      UserPreferencesRepository userPreferencesRepository) {
    this.userProfileRepository = userProfileRepository;
    this.userPreferencesRepository = userPreferencesRepository;
  }

  public UserPreferencesResponse getPreferences() {
    UserPreferences preferences = ensurePreferences();
    return toResponse(preferences);
  }

  public UserPreferencesResponse updatePreferences(UserPreferencesRequest request) {
    UserPreferences preferences = ensurePreferences();
    preferences.setShareProfile(request.getShareProfile());
    preferences.setSessionPresence(request.getSessionPresence());
    preferences.setNotifyFinds(request.getNotifyFinds());
    preferences.setThemeMode(request.getThemeMode());
    preferences.setAccentColor(request.getAccentColor());
    preferences.setEnableTooltipContrast(request.getEnableTooltipContrast());
    preferences.setReduceMotion(request.getReduceMotion());
    preferences.setUpdatedAt(LocalDateTime.now());
    preferences.setBroadcastVersion(preferences.getBroadcastVersion() + 1);

    UserPreferences saved = userPreferencesRepository.save(preferences);
    return toResponse(saved);
  }

  private UserPreferences ensurePreferences() {
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

    return userPreferencesRepository
        .findByProfile(profile)
        .orElseGet(
            () -> {
              UserPreferences preferences = new UserPreferences();
              preferences.setProfile(profile);
              preferences.setShareProfile(true);
              preferences.setSessionPresence(true);
              preferences.setNotifyFinds(false);
              preferences.setUpdatedAt(LocalDateTime.now());
              return userPreferencesRepository.save(preferences);
            });
  }

  private UserPreferencesResponse toResponse(UserPreferences preferences) {
    UserPreferencesResponse response = new UserPreferencesResponse();
    response.setId(preferences.getId());
    response.setShareProfile(preferences.isShareProfile());
    response.setSessionPresence(preferences.isSessionPresence());
    response.setNotifyFinds(preferences.isNotifyFinds());
    response.setThemeMode(preferences.getThemeMode());
    response.setAccentColor(preferences.getAccentColor());
    response.setEnableTooltipContrast(preferences.isEnableTooltipContrast());
    response.setReduceMotion(preferences.isReduceMotion());
    response.setUpdatedAt(preferences.getUpdatedAt());
    response.setBroadcastVersion(preferences.getBroadcastVersion());
    return response;
  }
}
