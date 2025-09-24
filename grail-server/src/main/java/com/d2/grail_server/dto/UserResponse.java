package com.d2.grail_server.dto;

import com.d2.grail_server.model.UserRole;
import java.time.LocalDateTime;

public class UserResponse {
  private Long id;
  private String username;
  private String email;
  private LocalDateTime createdAt;
  private UserRole role;

  public UserResponse() {}

  public UserResponse(
      Long id, String username, String email, LocalDateTime createdAt, UserRole role) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.createdAt = createdAt;
    this.role = role;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public UserRole getRole() {
    return role;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }
}
