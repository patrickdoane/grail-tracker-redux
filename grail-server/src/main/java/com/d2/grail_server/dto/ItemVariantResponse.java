package com.d2.grail_server.dto;

import java.util.List;

public class ItemVariantResponse {
  private String label;
  private String description;
  private List<String> attributes;

  public ItemVariantResponse() {}

  public ItemVariantResponse(String label, String description, List<String> attributes) {
    this.label = label;
    this.description = description;
    this.attributes = attributes;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public List<String> getAttributes() {
    return attributes;
  }

  public void setAttributes(List<String> attributes) {
    this.attributes = attributes;
  }
}
