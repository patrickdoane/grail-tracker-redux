package com.d2.grail_server.dto;

public class ItemPropertyResponse {
  private Long id;
  private Long itemId;
  private String propertyName;
  private String propertyValue;

  public ItemPropertyResponse() {}

  public ItemPropertyResponse(Long id, Long itemId, String propertyName, String propertyValue) {
    this.id = id;
    this.itemId = itemId;
    this.propertyName = propertyName;
    this.propertyValue = propertyValue;
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

  public String getPropertyName() {
    return propertyName;
  }

  public void setPropertyName(String propertyName) {
    this.propertyName = propertyName;
  }

  public String getPropertyValue() {
    return propertyValue;
  }

  public void setPropertyValue(String propertyValue) {
    this.propertyValue = propertyValue;
  }
}
