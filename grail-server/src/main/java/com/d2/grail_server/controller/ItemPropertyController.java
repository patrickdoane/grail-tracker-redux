package com.d2.grail_server.controller;

import com.d2.grail_server.dto.ItemPropertyRequest;
import com.d2.grail_server.dto.ItemPropertyResponse;
import com.d2.grail_server.service.ItemPropertyService;
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
@RequestMapping("/api/item-properties")
public class ItemPropertyController {

  private final ItemPropertyService itemPropertyService;

  public ItemPropertyController(ItemPropertyService itemPropertyService) {
    this.itemPropertyService = itemPropertyService;
  }

  @GetMapping
  public List<ItemPropertyResponse> getProperties(@RequestParam(required = false) Long itemId) {
    if (itemId != null) {
      return itemPropertyService.getPropertiesByItemId(itemId);
    }
    return itemPropertyService.getAllProperties();
  }

  @GetMapping("/{id}")
  public ItemPropertyResponse getProperty(@PathVariable Long id) {
    return itemPropertyService.getProperty(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ItemPropertyResponse createProperty(@Valid @RequestBody ItemPropertyRequest request) {
    return itemPropertyService.createProperty(request);
  }

  @PutMapping("/{id}")
  public ItemPropertyResponse updateProperty(
      @PathVariable Long id, @Valid @RequestBody ItemPropertyRequest request) {
    return itemPropertyService.updateProperty(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProperty(@PathVariable Long id) {
    itemPropertyService.deleteProperty(id);
  }
}
