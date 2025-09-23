package com.d2.grail_server.controller;

import com.d2.grail_server.dto.CollectionsResponse;
import com.d2.grail_server.service.CollectionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

  private final CollectionService collectionService;

  public CollectionController(CollectionService collectionService) {
    this.collectionService = collectionService;
  }

  @GetMapping
  public CollectionsResponse getCollections(@RequestParam(required = false) Long userId) {
    return collectionService.getCollections(userId);
  }
}
