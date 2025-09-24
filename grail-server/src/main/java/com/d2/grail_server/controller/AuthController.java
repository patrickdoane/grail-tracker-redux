package com.d2.grail_server.controller;

import com.d2.grail_server.dto.AuthResponse;
import com.d2.grail_server.dto.LoginRequest;
import com.d2.grail_server.dto.RegisterRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.security.UserPrincipal;
import com.d2.grail_server.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    return authService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @GetMapping("/me")
  public UserResponse currentUser(@AuthenticationPrincipal UserPrincipal principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    return new UserResponse(
        principal.getUser().getId(),
        principal.getUsername(),
        principal.getUser().getEmail(),
        principal.getUser().getCreatedAt(),
        principal.getUser().getRole().name());
  }
}
