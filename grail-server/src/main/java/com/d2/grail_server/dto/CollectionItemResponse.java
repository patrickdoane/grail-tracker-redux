package com.d2.grail_server.dto;

public class CollectionItemResponse {
  private Long itemId;
  private String name;
  private String slot;
  private boolean found;

  public CollectionItemResponse() {}

  public CollectionItemResponse(Long itemId, String name, String slot, boolean found) {
    this.itemId = itemId;
    this.name = name;
    this.slot = slot;
    this.found = found;
  }

  public Long getItemId() {
    return itemId;
  }

  public void setItemId(Long itemId) {
    this.itemId = itemId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getSlot() {
    return slot;
  }

  public void setSlot(String slot) {
    this.slot = slot;
  }

  public boolean isFound() {
    return found;
  }

  public void setFound(boolean found) {
    this.found = found;
  }
}
