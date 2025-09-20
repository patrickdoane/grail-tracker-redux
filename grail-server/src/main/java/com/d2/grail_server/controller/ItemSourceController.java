package com.d2.grail_server.controller;

import com.d2.grail_server.dto.ItemSourceRequest;
import com.d2.grail_server.dto.ItemSourceResponse;
import com.d2.grail_server.service.ItemSourceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/item-sources")
public class ItemSourceController {

  private final ItemSourceService itemSourceService;

  public ItemSourceController(ItemSourceService itemSourceService) {
    this.itemSourceService = itemSourceService;
  }

  @GetMapping
  public List<ItemSourceResponse> getSources(@RequestParam(required = false) Long itemId) {
    if (itemId != null) {
      return itemSourceService.getSourcesByItemId(itemId);
    }
    return itemSourceService.getAllSources();
  }

  @GetMapping("/{id}")
  public ItemSourceResponse getSource(@PathVariable Long id) {
    return itemSourceService.getSource(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ItemSourceResponse createSource(@Valid @RequestBody ItemSourceRequest request) {
    return itemSourceService.createSource(request);
  }

  @PutMapping("/{id}")
  public ItemSourceResponse updateSource(
      @PathVariable Long id, @Valid @RequestBody ItemSourceRequest request) {
    return itemSourceService.updateSource(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSource(@PathVariable Long id) {
    itemSourceService.deleteSource(id);
  }
}
