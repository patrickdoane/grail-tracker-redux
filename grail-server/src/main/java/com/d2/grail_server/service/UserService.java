package com.d2.grail_server.service;

import com.d2.grail_server.dto.UserRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.exception.ConflictException;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.User;
import com.d2.grail_server.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
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

  public UserResponse createUser(UserRequest request) {
    ensureUsernameAvailable(request.getUsername(), null);
    ensureEmailAvailable(request.getEmail(), null);
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

  private void applyRequest(User user, UserRequest request) {
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPasswordHash(request.getPasswordHash());
  }

  private UserResponse toResponse(User user) {
    return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getCreatedAt());
  }
}
