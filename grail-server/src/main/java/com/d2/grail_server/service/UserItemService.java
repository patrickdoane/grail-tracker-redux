package com.d2.grail_server.service;

import com.d2.grail_server.dto.UserItemRequest;
import com.d2.grail_server.dto.UserItemResponse;
import com.d2.grail_server.exception.ConflictException;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.User;
import com.d2.grail_server.model.UserItem;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.UserItemRepository;
import com.d2.grail_server.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserItemService {

  private final UserItemRepository userItemRepository;
  private final UserRepository userRepository;
  private final ItemRepository itemRepository;

  public UserItemService(
      UserItemRepository userItemRepository,
      UserRepository userRepository,
      ItemRepository itemRepository) {
    this.userItemRepository = userItemRepository;
    this.userRepository = userRepository;
    this.itemRepository = itemRepository;
  }

  @Transactional(readOnly = true)
  public List<UserItemResponse> getAllUserItems() {
    return userItemRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<UserItemResponse> getUserItemsByUserId(Long userId) {
    return userItemRepository.findByUserId(userId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<UserItemResponse> getUserItemsByItemId(Long itemId) {
    return userItemRepository.findByItemId(itemId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public UserItemResponse getUserItem(Long id) {
    UserItem userItem = findUserItem(id);
    return toResponse(userItem);
  }

  public UserItemResponse createUserItem(UserItemRequest request) {
    User user = findUser(request.getUserId());
    Item item = findItem(request.getItemId());
    validateItemAllowed(item);
    UserItem userItem = new UserItem();
    applyRequest(userItem, request, user, item);
    UserItem saved = userItemRepository.save(userItem);
    return toResponse(saved);
  }

  public UserItemResponse updateUserItem(Long id, UserItemRequest request) {
    UserItem userItem = findUserItem(id);
    User user = findUser(request.getUserId());
    Item item = findItem(request.getItemId());
    validateItemAllowed(item);
    applyRequest(userItem, request, user, item);
    UserItem saved = userItemRepository.save(userItem);
    return toResponse(saved);
  }

  public void deleteUserItem(Long id) {
    if (!userItemRepository.existsById(id)) {
      throw new ResourceNotFoundException(String.format("User item %d not found", id));
    }
    userItemRepository.deleteById(id);
  }

  private UserItem findUserItem(Long id) {
    return userItemRepository
        .findById(id)
        .orElseThrow(
            () -> new ResourceNotFoundException(String.format("User item %d not found", id)));
  }

  private User findUser(Long userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(
            () -> new ResourceNotFoundException(String.format("User %d not found", userId)));
  }

  private Item findItem(Long itemId) {
    return itemRepository
        .findById(itemId)
        .orElseThrow(
            () -> new ResourceNotFoundException(String.format("Item %d not found", itemId)));
  }

  private void applyRequest(UserItem userItem, UserItemRequest request, User user, Item item) {
    userItem.setUser(user);
    userItem.setItem(item);
    LocalDateTime foundAt =
        request.getFoundAt() != null ? request.getFoundAt().toLocalDateTime() : null;
    userItem.setFoundAt(foundAt != null ? foundAt : userItem.getFoundAt());
    userItem.setNotes(request.getNotes());
    if (foundAt == null && userItem.getFoundAt() == null) {
      userItem.setFoundAt(LocalDateTime.now());
    }
  }

  private UserItemResponse toResponse(UserItem userItem) {
    return new UserItemResponse(
        userItem.getId(),
        userItem.getUser().getId(),
        userItem.getItem().getId(),
        userItem.getFoundAt(),
        userItem.getNotes());
  }

  private void validateItemAllowed(Item item) {
    String quality = item.getQuality();
    if (quality != null && quality.equalsIgnoreCase("Rune")) {
      throw new ConflictException(
          "Rune ownership tracking is disabled until authentication is available.");
    }
  }
}
