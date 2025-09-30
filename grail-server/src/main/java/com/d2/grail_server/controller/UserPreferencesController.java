package com.d2.grail_server.controller;

import com.d2.grail_server.dto.UserPreferencesRequest;
import com.d2.grail_server.dto.UserPreferencesResponse;
import com.d2.grail_server.service.UserPreferencesService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user-preferences")
public class UserPreferencesController {
  private final UserPreferencesService userPreferencesService;

  public UserPreferencesController(UserPreferencesService userPreferencesService) {
    this.userPreferencesService = userPreferencesService;
  }

  @GetMapping
  public UserPreferencesResponse getPreferences() {
    return userPreferencesService.getPreferences();
  }

  @PutMapping
  public UserPreferencesResponse updatePreferences(@Valid @RequestBody UserPreferencesRequest request) {
    return userPreferencesService.updatePreferences(request);
  }
}
