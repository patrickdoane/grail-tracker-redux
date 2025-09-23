package com.d2.grail_server.service;

import com.d2.grail_server.dto.ItemPropertyRequest;
import com.d2.grail_server.dto.ItemPropertyResponse;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemProperty;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ItemPropertyService {

  private final ItemPropertyRepository itemPropertyRepository;
  private final ItemRepository itemRepository;

  public ItemPropertyService(
      ItemPropertyRepository itemPropertyRepository, ItemRepository itemRepository) {
    this.itemPropertyRepository = itemPropertyRepository;
    this.itemRepository = itemRepository;
  }

  @Transactional(readOnly = true)
  public List<ItemPropertyResponse> getAllProperties() {
    return itemPropertyRepository.findAll().stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<ItemPropertyResponse> getPropertiesByItemId(Long itemId) {
    return itemPropertyRepository.findByItemId(itemId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public ItemPropertyResponse getProperty(Long id) {
    ItemProperty property =
        itemPropertyRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(String.format("Item property %d not found", id)));
    return toResponse(property);
  }

  public ItemPropertyResponse createProperty(ItemPropertyRequest request) {
    Item item =
        itemRepository
            .findById(request.getItemId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        String.format("Item %d not found", request.getItemId())));
    ItemProperty property = new ItemProperty();
    property.setItem(item);
    property.setPropertyName(request.getPropertyName());
    property.setPropertyValue(request.getPropertyValue());
    ItemProperty saved = itemPropertyRepository.save(property);
    return toResponse(saved);
  }

  public ItemPropertyResponse updateProperty(Long id, ItemPropertyRequest request) {
    ItemProperty property =
        itemPropertyRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(String.format("Item property %d not found", id)));
    Item item =
        itemRepository
            .findById(request.getItemId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        String.format("Item %d not found", request.getItemId())));
    property.setItem(item);
    property.setPropertyName(request.getPropertyName());
    property.setPropertyValue(request.getPropertyValue());
    ItemProperty saved = itemPropertyRepository.save(property);
    return toResponse(saved);
  }

  public void deleteProperty(Long id) {
    if (!itemPropertyRepository.existsById(id)) {
      throw new ResourceNotFoundException(String.format("Item property %d not found", id));
    }
    itemPropertyRepository.deleteById(id);
  }

  private ItemPropertyResponse toResponse(ItemProperty property) {
    return new ItemPropertyResponse(
        property.getId(),
        property.getItem().getId(),
        property.getPropertyName(),
        property.getPropertyValue());
  }
}
