package com.d2.grail_server.controller;

import com.d2.grail_server.dto.UserItemRequest;
import com.d2.grail_server.dto.UserItemResponse;
import com.d2.grail_server.service.UserItemService;
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
@RequestMapping("/api/user-items")
public class UserItemController {

  private final UserItemService userItemService;

  public UserItemController(UserItemService userItemService) {
    this.userItemService = userItemService;
  }

  @GetMapping
  public List<UserItemResponse> getUserItems(
      @RequestParam(required = false) Long userId, @RequestParam(required = false) Long itemId) {
    if (userId != null) {
      return userItemService.getUserItemsByUserId(userId);
    }
    if (itemId != null) {
      return userItemService.getUserItemsByItemId(itemId);
    }
    return userItemService.getAllUserItems();
  }

  @GetMapping("/{id}")
  public UserItemResponse getUserItem(@PathVariable Long id) {
    return userItemService.getUserItem(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserItemResponse createUserItem(@Valid @RequestBody UserItemRequest request) {
    return userItemService.createUserItem(request);
  }

  @PutMapping("/{id}")
  public UserItemResponse updateUserItem(
      @PathVariable Long id, @Valid @RequestBody UserItemRequest request) {
    return userItemService.updateUserItem(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteUserItem(@PathVariable Long id) {
    userItemService.deleteUserItem(id);
  }
}
