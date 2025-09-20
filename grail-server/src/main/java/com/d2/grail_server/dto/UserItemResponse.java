package com.d2.grail_server.dto;

import java.time.LocalDateTime;

public class UserItemResponse {
  private Long id;
  private Long userId;
  private Long itemId;
  private LocalDateTime foundAt;
  private String notes;

  public UserItemResponse() {}

  public UserItemResponse(Long id, Long userId, Long itemId, LocalDateTime foundAt, String notes) {
    this.id = id;
    this.userId = userId;
    this.itemId = itemId;
    this.foundAt = foundAt;
    this.notes = notes;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public Long getItemId() {
    return itemId;
  }

  public void setItemId(Long itemId) {
    this.itemId = itemId;
  }

  public LocalDateTime getFoundAt() {
    return foundAt;
  }

  public void setFoundAt(LocalDateTime foundAt) {
    this.foundAt = foundAt;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
