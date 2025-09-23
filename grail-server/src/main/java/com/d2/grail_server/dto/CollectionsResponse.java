package com.d2.grail_server.dto;

import java.util.List;

public class CollectionsResponse {
  private List<CollectionSummaryResponse> sets;
  private List<CollectionSummaryResponse> runewords;

  public CollectionsResponse() {}

  public CollectionsResponse(
      List<CollectionSummaryResponse> sets,
      List<CollectionSummaryResponse> runewords) {
    this.sets = sets;
    this.runewords = runewords;
  }

  public List<CollectionSummaryResponse> getSets() {
    return sets;
  }

  public void setSets(List<CollectionSummaryResponse> sets) {
    this.sets = sets;
  }

  public List<CollectionSummaryResponse> getRunewords() {
    return runewords;
  }

  public void setRunewords(List<CollectionSummaryResponse> runewords) {
    this.runewords = runewords;
  }
}
