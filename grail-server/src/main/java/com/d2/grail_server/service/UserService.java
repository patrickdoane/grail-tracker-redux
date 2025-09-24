package com.d2.grail_server.service;

import com.d2.grail_server.dto.RegisterRequest;
import com.d2.grail_server.dto.UserRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.exception.ConflictException;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.User;
import com.d2.grail_server.model.UserRole;
import com.d2.grail_server.repository.UserRepository;
import com.d2.grail_server.security.UserPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService implements UserDetailsService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public List<UserResponse> getAllUsers() {
    return userRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public UserResponse getUser(Long id) {
    User user = findUser(id);
    return toResponse(user);
  }

  @Transactional(readOnly = true)
  public UserResponse getUserByUsernameOrEmail(String usernameOrEmail) {
    return findByUsernameOrEmail(usernameOrEmail)
        .map(this::toResponse)
        .orElseThrow(
            () ->
                new ResourceNotFoundException(
                    String.format(
                        "User with username or email '%s' not found", usernameOrEmail)));
  }

  public UserResponse createUser(UserRequest request) {
    ensureUsernameAvailable(request.getUsername(), null);
    ensureEmailAvailable(request.getEmail(), null);
    if (request.getPassword() == null || request.getPassword().isBlank()) {
      throw new IllegalArgumentException("Password is required when creating a user");
    }
    User user = new User();
    applyRequest(user, request);
    User saved = userRepository.save(user);
    return toResponse(saved);
  }

  public UserResponse updateUser(Long id, UserRequest request) {
    User user = findUser(id);
    ensureUsernameAvailable(request.getUsername(), id);
    ensureEmailAvailable(request.getEmail(), id);
    applyRequest(user, request);
    User saved = userRepository.save(user);
    return toResponse(saved);
  }

  public void deleteUser(Long id) {
    if (!userRepository.existsById(id)) {
      throw new ResourceNotFoundException(String.format("User %d not found", id));
    }
    userRepository.deleteById(id);
  }

  private User findUser(Long id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(String.format("User %d not found", id)));
  }

  private Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
    if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
      return Optional.empty();
    }
    return userRepository.findByUsername(usernameOrEmail)
        .or(() -> userRepository.findByEmail(usernameOrEmail));
  }

  private void ensureUsernameAvailable(String username, Long excludingId) {
    Optional<User> existing = userRepository.findByUsername(username);
    if (existing.isPresent() && !existing.get().getId().equals(excludingId)) {
      throw new ConflictException(String.format("Username '%s' already in use", username));
    }
  }

  private void ensureEmailAvailable(String email, Long excludingId) {
    Optional<User> existing = userRepository.findByEmail(email);
    if (existing.isPresent() && !existing.get().getId().equals(excludingId)) {
      throw new ConflictException(String.format("Email '%s' already in use", email));
    }
  }

  public UserResponse registerUser(RegisterRequest request) {
    ensureUsernameAvailable(request.getUsername(), null);
    ensureEmailAvailable(request.getEmail(), null);
    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(UserRole.USER);
    User saved = userRepository.save(user);
    return toResponse(saved);
  }

  private void applyRequest(User user, UserRequest request) {
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    }
    if (request.getRole() != null) {
      user.setRole(request.getRole());
    }
  }

  private UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(), user.getUsername(), user.getEmail(), user.getCreatedAt(), user.getRole());
  }

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    return findByUsernameOrEmail(username)
        .map(UserPrincipal::fromUser)
        .orElseThrow(
            () ->
                new UsernameNotFoundException(
                    String.format("User with username or email '%s' not found", username)));
  }
}
