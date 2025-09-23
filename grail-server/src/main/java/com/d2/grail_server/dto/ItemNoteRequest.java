package com.d2.grail_server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ItemNoteRequest {

  @NotBlank
  @Size(max = 60)
  private String authorName;

  @NotBlank
  @Size(max = 1024)
  private String body;

  public String getAuthorName() {
    return authorName;
  }

  public void setAuthorName(String authorName) {
    this.authorName = authorName;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }
}
