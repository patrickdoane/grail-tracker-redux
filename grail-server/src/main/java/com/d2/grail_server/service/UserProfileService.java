package com.d2.grail_server.service;

import com.d2.grail_server.dto.UserProfileRequest;
import com.d2.grail_server.dto.UserProfileResponse;
import com.d2.grail_server.model.UserProfile;
import com.d2.grail_server.repository.UserProfileRepository;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@Transactional
public class UserProfileService {
  private final UserProfileRepository userProfileRepository;

  public UserProfileService(UserProfileRepository userProfileRepository) {
    this.userProfileRepository = userProfileRepository;
  }

  public UserProfileResponse getProfile() {
    UserProfile profile = ensureProfile();
    return toResponse(profile);
  }

  public UserProfileResponse updateProfile(UserProfileRequest request) {
    validateTimezone(request.getTimezone());

    UserProfile profile = ensureProfile();
    profile.setDisplayName(request.getDisplayName().trim());
    profile.setTagline(request.getTagline());
    profile.setEmail(request.getEmail().toLowerCase());
    profile.setTimezone(request.getTimezone());
    profile.setUpdatedAt(LocalDateTime.now());

    UserProfile saved = userProfileRepository.save(profile);
    return toResponse(saved);
  }

  private UserProfile ensureProfile() {
    return userProfileRepository
        .findTopByOrderByUpdatedAtDesc()
        .orElseGet(
            () -> {
              UserProfile profile = new UserProfile();
              profile.setDisplayName("Grail Seeker");
              profile.setTagline("Tracking every last drop.");
              profile.setEmail("grail@example.com");
              profile.setTimezone("UTC");
              profile.setUpdatedAt(LocalDateTime.now());
              return userProfileRepository.save(profile);
            });
  }

  private void validateTimezone(String timezone) {
    try {
      ZoneId.of(timezone);
    } catch (Exception ex) {
      throw new ResponseStatusException(BAD_REQUEST, "Invalid timezone supplied");
    }
  }

  private UserProfileResponse toResponse(UserProfile profile) {
    UserProfileResponse response = new UserProfileResponse();
    response.setId(profile.getId());
    response.setDisplayName(profile.getDisplayName());
    response.setTagline(profile.getTagline());
    response.setEmail(profile.getEmail());
    response.setTimezone(profile.getTimezone());
    response.setUpdatedAt(profile.getUpdatedAt());
    return response;
  }
}
