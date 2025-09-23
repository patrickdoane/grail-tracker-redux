package com.d2.grail_server.controller;

import com.d2.grail_server.dto.ItemDetailResponse;
import com.d2.grail_server.dto.ItemRequest;
import com.d2.grail_server.dto.ItemResponse;
import com.d2.grail_server.service.ItemService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
public class ItemController {

  private final ItemService itemService;

  public ItemController(ItemService itemService) {
    this.itemService = itemService;
  }

  @GetMapping
  public List<ItemResponse> getItems() {
    return itemService.getAllItems();
  }

  @GetMapping("/{id}")
  public ItemResponse getItem(@PathVariable Long id) {
    return itemService.getItem(id);
  }

  @GetMapping("/{id}/details")
  public ItemDetailResponse getItemDetail(@PathVariable Long id) {
    return itemService.getItemDetail(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ItemResponse createItem(@Valid @RequestBody ItemRequest request) {
    return itemService.createItem(request);
  }

  @PutMapping("/{id}")
  public ItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
    return itemService.updateItem(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteItem(@PathVariable Long id) {
    itemService.deleteItem(id);
  }
}
