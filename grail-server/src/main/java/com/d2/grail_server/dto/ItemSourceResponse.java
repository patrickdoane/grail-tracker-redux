package com.d2.grail_server.dto;

public class ItemSourceResponse {
  private Long id;
  private Long itemId;
  private String sourceType;
  private String sourceName;

  public ItemSourceResponse() {}

  public ItemSourceResponse(Long id, Long itemId, String sourceType, String sourceName) {
    this.id = id;
    this.itemId = itemId;
    this.sourceType = sourceType;
    this.sourceName = sourceName;
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

  public String getSourceType() {
    return sourceType;
  }

  public void setSourceType(String sourceType) {
    this.sourceType = sourceType;
  }

  public String getSourceName() {
    return sourceName;
  }

  public void setSourceName(String sourceName) {
    this.sourceName = sourceName;
  }
}
