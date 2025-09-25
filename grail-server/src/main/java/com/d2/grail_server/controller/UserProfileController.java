package com.d2.grail_server.controller;

import com.d2.grail_server.dto.UserProfileRequest;
import com.d2.grail_server.dto.UserProfileResponse;
import com.d2.grail_server.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user-profile")
public class UserProfileController {
  private final UserProfileService userProfileService;

  public UserProfileController(UserProfileService userProfileService) {
    this.userProfileService = userProfileService;
  }

  @GetMapping
  public UserProfileResponse getProfile() {
    return userProfileService.getProfile();
  }

  @PutMapping
  public UserProfileResponse updateProfile(@Valid @RequestBody UserProfileRequest request) {
    return userProfileService.updateProfile(request);
  }
}
