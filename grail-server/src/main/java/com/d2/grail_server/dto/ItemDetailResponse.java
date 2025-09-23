package com.d2.grail_server.dto;

import java.util.List;

public class ItemDetailResponse {
  private ItemResponse item;
  private List<ItemPropertyResponse> properties;
  private List<ItemSourceResponse> sources;
  private List<ItemVariantResponse> variants;
  private List<ItemNoteResponse> notes;

  public ItemDetailResponse() {}

  public ItemDetailResponse(
      ItemResponse item,
      List<ItemPropertyResponse> properties,
      List<ItemSourceResponse> sources,
      List<ItemVariantResponse> variants,
      List<ItemNoteResponse> notes) {
    this.item = item;
    this.properties = properties;
    this.sources = sources;
    this.variants = variants;
    this.notes = notes;
  }

  public ItemResponse getItem() {
    return item;
  }

  public void setItem(ItemResponse item) {
    this.item = item;
  }

  public List<ItemPropertyResponse> getProperties() {
    return properties;
  }

  public void setProperties(List<ItemPropertyResponse> properties) {
    this.properties = properties;
  }

  public List<ItemSourceResponse> getSources() {
    return sources;
  }

  public void setSources(List<ItemSourceResponse> sources) {
    this.sources = sources;
  }

  public List<ItemVariantResponse> getVariants() {
    return variants;
  }

  public void setVariants(List<ItemVariantResponse> variants) {
    this.variants = variants;
  }

  public List<ItemNoteResponse> getNotes() {
    return notes;
  }

  public void setNotes(List<ItemNoteResponse> notes) {
    this.notes = notes;
  }
}
