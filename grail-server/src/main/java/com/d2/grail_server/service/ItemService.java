package com.d2.grail_server.service;

import com.d2.grail_server.dto.ItemDetailResponse;
import com.d2.grail_server.dto.ItemNoteResponse;
import com.d2.grail_server.dto.ItemPropertyResponse;
import com.d2.grail_server.dto.ItemRequest;
import com.d2.grail_server.dto.ItemResponse;
import com.d2.grail_server.dto.ItemSourceResponse;
import com.d2.grail_server.dto.ItemVariantResponse;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemNote;
import com.d2.grail_server.model.ItemProperty;
import com.d2.grail_server.model.ItemSource;
import com.d2.grail_server.repository.ItemNoteRepository;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.ItemSourceRepository;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ItemService {

  private final ItemRepository itemRepository;
  private final ItemPropertyRepository itemPropertyRepository;
  private final ItemSourceRepository itemSourceRepository;
  private final ItemNoteRepository itemNoteRepository;

  public ItemService(
      ItemRepository itemRepository,
      ItemPropertyRepository itemPropertyRepository,
      ItemSourceRepository itemSourceRepository,
      ItemNoteRepository itemNoteRepository) {
    this.itemRepository = itemRepository;
    this.itemPropertyRepository = itemPropertyRepository;
    this.itemSourceRepository = itemSourceRepository;
    this.itemNoteRepository = itemNoteRepository;
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
            .orElseThrow(() -> new ResourceNotFoundException(String.format("Item %d not found", id)));
    return toResponse(item);
  }

  @Transactional(readOnly = true)
  public ItemDetailResponse getItemDetail(Long id) {
    Item item =
        itemRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(String.format("Item %d not found", id)));

    List<ItemProperty> properties = itemPropertyRepository.findByItemId(id);
    List<ItemSource> sources = itemSourceRepository.findByItemId(id);
    List<ItemNote> itemNotes = itemNoteRepository.findByItemIdOrderByCreatedAtDesc(id);

    List<ItemPropertyResponse> propertyResponses =
        properties.stream().map(this::toPropertyResponse).collect(Collectors.toList());
    List<ItemSourceResponse> sourceResponses =
        sources.stream().map(this::toSourceResponse).collect(Collectors.toList());
    List<ItemVariantResponse> variantResponses = toVariantResponses(item, properties);
    List<ItemNoteResponse> noteResponses =
        itemNotes.stream().map(this::toNoteResponse).collect(Collectors.toList());

    return new ItemDetailResponse(
        toResponse(item), propertyResponses, sourceResponses, variantResponses, noteResponses);
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
            .orElseThrow(() -> new ResourceNotFoundException(String.format("Item %d not found", id)));
    applyRequest(item, request);
    Item saved = itemRepository.save(item);
    return toResponse(saved);
  }

  public void deleteItem(Long id) {
    if (!itemRepository.existsById(id)) {
      throw new ResourceNotFoundException(String.format("Item %d not found", id));
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

  private ItemPropertyResponse toPropertyResponse(ItemProperty property) {
    return new ItemPropertyResponse(
        property.getId(),
        property.getItem().getId(),
        property.getPropertyName(),
        property.getPropertyValue());
  }

  private ItemSourceResponse toSourceResponse(ItemSource source) {
    return new ItemSourceResponse(
        source.getId(), source.getItem().getId(), source.getSourceType(), source.getSourceName());
  }

  private ItemNoteResponse toNoteResponse(ItemNote itemNote) {
    return new ItemNoteResponse(
        itemNote.getId(),
        itemNote.getItem().getId(),
        itemNote.getAuthorName(),
        itemNote.getCreatedAt(),
        itemNote.getBody());
  }

  private List<ItemVariantResponse> toVariantResponses(Item item, List<ItemProperty> properties) {
    Map<String, VariantAccumulator> groupedVariants =
        properties.stream()
            .filter(Objects::nonNull)
            .filter(property -> property.getPropertyName() != null)
            .filter(
                property ->
                    property.getPropertyName().toLowerCase(Locale.ROOT).startsWith("variant"))
            .collect(
                Collectors.toMap(
                    property ->
                        normaliseVariantLabel(
                            property.getPropertyName(), property.getPropertyValue()),
                    property -> {
                      VariantAccumulator accumulator =
                          new VariantAccumulator(
                              normaliseVariantLabel(
                                  property.getPropertyName(), property.getPropertyValue()));
                      accumulator.addAttribute(property.getPropertyValue());
                      return accumulator;
                    },
                    (existing, incoming) -> {
                      if (incoming.getDescription() != null) {
                        existing.addAttribute(incoming.getDescription());
                      }
                      incoming.getAttributes().forEach(existing::addAttribute);
                      return existing;
                    },
                    java.util.LinkedHashMap::new));

    List<ItemVariantResponse> variants =
        groupedVariants.values().stream().map(VariantAccumulator::toResponse).collect(Collectors.toList());

    if (variants.isEmpty() && item.getDescription() != null && !item.getDescription().isBlank()) {
      VariantAccumulator fallback = new VariantAccumulator(item.getName());
      fallback.setDescription(item.getDescription());
      variants.add(fallback.toResponse());
    }

    return variants;
  }

  private String normaliseVariantLabel(String propertyName, String fallback) {
    if (propertyName == null) {
      return fallback != null ? fallback : "Variant";
    }

    String label = propertyName.substring("Variant".length()).trim();
    if (label.startsWith(":")) {
      label = label.substring(1).trim();
    }
    if (label.startsWith("-")) {
      label = label.substring(1).trim();
    }

    return label.isEmpty() ? (fallback != null ? fallback : "Variant") : label;
  }

  private static class VariantAccumulator {
    private final String label;
    private String description;
    private final java.util.List<String> attributes = new java.util.ArrayList<>();

    VariantAccumulator(String label) {
      this.label = label;
    }

    void addAttribute(String value) {
      if (value == null || value.isBlank()) {
        return;
      }
      if (description == null) {
        description = value;
        return;
      }
      attributes.add(value);
    }

    java.util.List<String> getAttributes() {
      return attributes;
    }

    void setDescription(String description) {
      this.description = description;
    }

    String getDescription() {
      return description;
    }

    ItemVariantResponse toResponse() {
      return new ItemVariantResponse(label, description, attributes);
    }
  }
}
