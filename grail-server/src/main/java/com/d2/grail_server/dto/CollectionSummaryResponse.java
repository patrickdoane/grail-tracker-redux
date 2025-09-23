package com.d2.grail_server.dto;

import java.util.List;

public class CollectionSummaryResponse {
  private String id;
  private String name;
  private String type;
  private String description;
  private int totalItems;
  private int foundItems;
  private List<CollectionItemResponse> items;

  public CollectionSummaryResponse() {}

  public CollectionSummaryResponse(
      String id,
      String name,
      String type,
      String description,
      int totalItems,
      int foundItems,
      List<CollectionItemResponse> items) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.description = description;
    this.totalItems = totalItems;
    this.foundItems = foundItems;
    this.items = items;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public int getTotalItems() {
    return totalItems;
  }

  public void setTotalItems(int totalItems) {
    this.totalItems = totalItems;
  }

  public int getFoundItems() {
    return foundItems;
  }

  public void setFoundItems(int foundItems) {
    this.foundItems = foundItems;
  }

  public List<CollectionItemResponse> getItems() {
    return items;
  }

  public void setItems(List<CollectionItemResponse> items) {
    this.items = items;
  }
}
