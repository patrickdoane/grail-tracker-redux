package com.d2.grail_server.controller;

import com.d2.grail_server.dto.AuthRequest;
import com.d2.grail_server.dto.AuthResponse;
import com.d2.grail_server.dto.RegisterRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.security.UserPrincipal;
import com.d2.grail_server.security.JwtService;
import com.d2.grail_server.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final UserService userService;

  public AuthController(
      AuthenticationManager authenticationManager, JwtService jwtService, UserService userService) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.userService = userService;
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody AuthRequest request) {
    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
    UserPrincipal principal =
        (UserPrincipal) userService.loadUserByUsername(authentication.getName());
    String token = jwtService.generateToken(principal);
    UserResponse user = userService.getUser(principal.getId());
    return new AuthResponse(token, user);
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    UserResponse user = userService.registerUser(request);
    UserPrincipal principal = (UserPrincipal) userService.loadUserByUsername(user.getUsername());
    String token = jwtService.generateToken(principal);
    return new AuthResponse(token, user);
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponse> currentUser(@AuthenticationPrincipal UserPrincipal principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(userService.getUser(principal.getId()));
  }
}
