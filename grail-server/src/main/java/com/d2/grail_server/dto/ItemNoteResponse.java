package com.d2.grail_server.dto;

import java.time.LocalDateTime;

public class ItemNoteResponse {
  private Long id;
  private Long itemId;
  private String authorName;
  private LocalDateTime createdAt;
  private String body;

  public ItemNoteResponse() {}

  public ItemNoteResponse(Long id, Long itemId, String authorName, LocalDateTime createdAt, String body) {
    this.id = id;
    this.itemId = itemId;
    this.authorName = authorName;
    this.createdAt = createdAt;
    this.body = body;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getItemId() {
    return itemId;
  }

  public void setItemId(Long itemId) {
    this.itemId = itemId;
  }

  public String getAuthorName() {
    return authorName;
  }

  public void setAuthorName(String authorName) {
    this.authorName = authorName;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }
}
