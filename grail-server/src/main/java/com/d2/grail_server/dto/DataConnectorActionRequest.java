package com.d2.grail_server.dto;

import jakarta.validation.constraints.NotBlank;

public class DataConnectorActionRequest {
  @NotBlank private String action;

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }
}
