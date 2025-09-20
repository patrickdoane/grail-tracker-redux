package com.d2.grail_server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ItemRequest {
  @NotBlank
  @Size(max = 100)
  private String name;

  @Size(max = 255)
  private String type;

  @Size(max = 255)
  private String quality;

  @Size(max = 255)
  private String rarity;

  @Size(max = 1024)
  private String description;

  @Size(max = 50)
  private String d2Version;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getQuality() {
    return quality;
  }

  public void setQuality(String quality) {
    this.quality = quality;
  }

  public String getRarity() {
    return rarity;
  }

  public void setRarity(String rarity) {
    this.rarity = rarity;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getD2Version() {
    return d2Version;
  }

  public void setD2Version(String d2Version) {
    this.d2Version = d2Version;
  }
}
