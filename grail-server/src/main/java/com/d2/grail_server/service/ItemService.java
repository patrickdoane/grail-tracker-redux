package com.d2.grail_server.service;

import com.d2.grail_server.dto.ItemRequest;
import com.d2.grail_server.dto.ItemResponse;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.repository.ItemRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ItemService {

  private final ItemRepository itemRepository;

  public ItemService(ItemRepository itemRepository) {
    this.itemRepository = itemRepository;
  }

  @Transactional(readOnly = true)
  public List<ItemResponse> getAllItems() {
    return itemRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public ItemResponse getItem(Long id) {
    Item item =
        itemRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item %d not found".formatted(id)));
    return toResponse(item);
  }

  public ItemResponse createItem(ItemRequest request) {
    Item item = new Item();
    applyRequest(item, request);
    Item saved = itemRepository.save(item);
    return toResponse(saved);
  }

  public ItemResponse updateItem(Long id, ItemRequest request) {
    Item item =
        itemRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item %d not found".formatted(id)));
    applyRequest(item, request);
    Item saved = itemRepository.save(item);
    return toResponse(saved);
  }

  public void deleteItem(Long id) {
    if (!itemRepository.existsById(id)) {
      throw new ResourceNotFoundException("Item %d not found".formatted(id));
    }
    itemRepository.deleteById(id);
  }

  private void applyRequest(Item item, ItemRequest request) {
    item.setName(request.getName());
    item.setType(request.getType());
    item.setQuality(request.getQuality());
    item.setRarity(request.getRarity());
    item.setDescription(request.getDescription());
    item.setD2Version(request.getD2Version());
  }

  private ItemResponse toResponse(Item item) {
    return new ItemResponse(
        item.getId(),
        item.getName(),
        item.getType(),
        item.getQuality(),
        item.getRarity(),
        item.getDescription(),
        item.getD2Version());
  }
}
