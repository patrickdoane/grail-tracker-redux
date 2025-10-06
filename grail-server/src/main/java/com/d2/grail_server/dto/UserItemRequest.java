package com.d2.grail_server.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public class UserItemRequest {
  @NotNull private Long userId;

  @NotNull private Long itemId;

  private OffsetDateTime foundAt;

  @Size(max = 1024)
  private String notes;

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

  public OffsetDateTime getFoundAt() {
    return foundAt;
  }

  public void setFoundAt(OffsetDateTime foundAt) {
    this.foundAt = foundAt;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
