package com.d2.grail_server.service;

import com.d2.grail_server.dto.ItemSourceRequest;
import com.d2.grail_server.dto.ItemSourceResponse;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemSource;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.ItemSourceRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ItemSourceService {

  private final ItemSourceRepository itemSourceRepository;
  private final ItemRepository itemRepository;

  public ItemSourceService(
      ItemSourceRepository itemSourceRepository, ItemRepository itemRepository) {
    this.itemSourceRepository = itemSourceRepository;
    this.itemRepository = itemRepository;
  }

  @Transactional(readOnly = true)
  public List<ItemSourceResponse> getAllSources() {
    return itemSourceRepository.findAll().stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<ItemSourceResponse> getSourcesByItemId(Long itemId) {
    return itemSourceRepository.findByItemId(itemId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public ItemSourceResponse getSource(Long id) {
    ItemSource source =
        itemSourceRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Item source %d not found".formatted(id)));
    return toResponse(source);
  }

  public ItemSourceResponse createSource(ItemSourceRequest request) {
    Item item =
        itemRepository
            .findById(request.getItemId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Item %d not found".formatted(request.getItemId())));
    ItemSource source = new ItemSource();
    source.setItem(item);
    source.setSourceType(request.getSourceType());
    source.setSourceName(request.getSourceName());
    ItemSource saved = itemSourceRepository.save(source);
    return toResponse(saved);
  }

  public ItemSourceResponse updateSource(Long id, ItemSourceRequest request) {
    ItemSource source =
        itemSourceRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Item source %d not found".formatted(id)));
    Item item =
        itemRepository
            .findById(request.getItemId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Item %d not found".formatted(request.getItemId())));
    source.setItem(item);
    source.setSourceType(request.getSourceType());
    source.setSourceName(request.getSourceName());
    ItemSource saved = itemSourceRepository.save(source);
    return toResponse(saved);
  }

  public void deleteSource(Long id) {
    if (!itemSourceRepository.existsById(id)) {
      throw new ResourceNotFoundException("Item source %d not found".formatted(id));
    }
    itemSourceRepository.deleteById(id);
  }

  private ItemSourceResponse toResponse(ItemSource source) {
    return new ItemSourceResponse(
        source.getId(), source.getItem().getId(), source.getSourceType(), source.getSourceName());
  }
}
