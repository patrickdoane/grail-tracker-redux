package com.d2.grail_server.service;

import com.d2.grail_server.dto.AuthResponse;
import com.d2.grail_server.dto.LoginRequest;
import com.d2.grail_server.dto.RegisterRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.exception.ConflictException;
import com.d2.grail_server.model.Role;
import com.d2.grail_server.model.User;
import com.d2.grail_server.repository.UserRepository;
import com.d2.grail_server.security.JwtService;
import com.d2.grail_server.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new ConflictException("Username already taken");
    }
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new ConflictException("Email already registered");
    }

    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(Role.USER);

    User saved = userRepository.save(user);
    UserDetails userDetails = new UserPrincipal(saved);
    String token = jwtService.generateToken(userDetails);
    return new AuthResponse(token, toResponse(saved));
  }

  public AuthResponse login(LoginRequest request) {
    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsernameOrEmail(), request.getPassword()));
    UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
    String token = jwtService.generateToken((UserDetails) principal);
    return new AuthResponse(token, toResponse(principal.getUser()));
  }

  private UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(), user.getUsername(), user.getEmail(), user.getCreatedAt(), user.getRole().name());
  }
}
