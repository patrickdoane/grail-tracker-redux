package com.d2.grail_server.service;

import com.d2.grail_server.dto.CollectionItemResponse;
import com.d2.grail_server.dto.CollectionSummaryResponse;
import com.d2.grail_server.dto.CollectionsResponse;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemProperty;
import com.d2.grail_server.model.UserItem;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.UserItemRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class CollectionService {

  private final ItemPropertyRepository itemPropertyRepository;
  private final UserItemRepository userItemRepository;
  private final ItemRepository itemRepository;

  public CollectionService(
      ItemPropertyRepository itemPropertyRepository,
      UserItemRepository userItemRepository,
      ItemRepository itemRepository) {
    this.itemPropertyRepository = itemPropertyRepository;
    this.userItemRepository = userItemRepository;
    this.itemRepository = itemRepository;
  }

  public CollectionsResponse getCollections(Long userId) {
    Set<Long> foundItemIds = resolveFoundItemIds(userId);

    List<ItemProperty> properties = itemPropertyRepository.findAll();

    List<CollectionSummaryResponse> setCollections =
        buildSetCollections(foundItemIds, properties);
    List<CollectionSummaryResponse> runewordCollections =
        buildRunewordCollections(foundItemIds, properties);

    return new CollectionsResponse(setCollections, runewordCollections);
  }

  private List<CollectionSummaryResponse> buildSetCollections(
      Set<Long> foundItemIds, List<ItemProperty> properties) {
    Map<String, List<ItemProperty>> groupedBySetName =
        properties.stream()
            .filter(property -> StringUtils.hasText(property.getPropertyName()))
            .filter(property -> StringUtils.hasText(property.getPropertyValue()))
            .filter(property ->
                property.getPropertyName().toLowerCase(Locale.ROOT).equals("set name"))
            .collect(
                Collectors.groupingBy(
                    property -> property.getPropertyValue(),
                    LinkedHashMap::new,
                    Collectors.toList()));

    List<CollectionSummaryResponse> summaries = new ArrayList<>();

    groupedBySetName.forEach(
        (setName, entries) -> {
          Map<Long, Item> itemsById =
              entries.stream()
                  .map(ItemProperty::getItem)
                  .filter(Objects::nonNull)
                  .filter(item -> item.getId() != null)
                  .collect(
                      Collectors.toMap(
                          Item::getId,
                          item -> item,
                          (existing, incoming) -> existing,
                          LinkedHashMap::new));

          List<CollectionItemResponse> items =
              itemsById.values().stream()
                  .map(item -> toCollectionItem(item, foundItemIds))
                  .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                  .collect(Collectors.toList());

          int totalItems = items.size();
          int foundItems = (int) items.stream().filter(CollectionItemResponse::isFound).count();

          CollectionSummaryResponse summary =
              new CollectionSummaryResponse(
                  slugify(setName), setName, "set", null, totalItems, foundItems, items);
          summaries.add(summary);
        });

    return summaries;
  }

  private List<CollectionSummaryResponse> buildRunewordCollections(
      Set<Long> foundItemIds, List<ItemProperty> properties) {
    List<Item> runewords = itemRepository.findByQualityIgnoreCase("Runeword");
    if (runewords.isEmpty()) {
      return Collections.emptyList();
    }

    Map<String, Item> runeItemsByName =
        itemRepository.findByQualityIgnoreCase("Rune").stream()
            .filter(item -> StringUtils.hasText(item.getName()))
            .collect(
                Collectors.toMap(
                    item -> item.getName().toLowerCase(Locale.ROOT),
                    item -> item,
                    (existing, incoming) -> existing,
                    LinkedHashMap::new));

    Map<Long, List<ItemProperty>> propertiesByItemId =
        properties.stream()
            .filter(prop -> prop.getItem() != null && prop.getItem().getId() != null)
            .collect(
                Collectors.groupingBy(
                    prop -> prop.getItem().getId(), LinkedHashMap::new, Collectors.toList()));

    return runewords.stream()
        .sorted(
            (left, right) ->
                safeText(left.getName()).compareToIgnoreCase(safeText(right.getName())))
        .map(
            runeword ->
                toRunewordCollection(
                    runeword, foundItemIds, runeItemsByName, propertiesByItemId))
        .collect(Collectors.toList());
  }

  private CollectionSummaryResponse toRunewordCollection(
      Item runeword,
      Set<Long> foundItemIds,
      Map<String, Item> runeItemsByName,
      Map<Long, List<ItemProperty>> propertiesByItemId) {

    Long runewordId = runeword.getId();
    List<ItemProperty> runewordProperties =
        runewordId != null
            ? propertiesByItemId.getOrDefault(runewordId, Collections.emptyList())
            : Collections.emptyList();
    RunewordMetadata metadata = parseRunewordMetadata(runeword, runewordProperties);

    List<CollectionItemResponse> checklist = new ArrayList<>();
    int foundCount = 0;
    List<String> runes = metadata.getRunes();
    for (int index = 0; index < runes.size(); index++) {
      String runeName = runes.get(index);
      Item runeItem = runeItemsByName.get(runeName.toLowerCase(Locale.ROOT));
      boolean runeFound = runeItem != null && foundItemIds.contains(runeItem.getId());
      if (runeFound) {
        foundCount++;
      }
      String entryName = String.format("%d. %s", index + 1, runeName);
      checklist.add(new CollectionItemResponse(null, entryName, "Rune", runeFound));
    }

    if (checklist.isEmpty()) {
      boolean crafted = runewordId != null && foundItemIds.contains(runewordId);
      checklist.add(
          new CollectionItemResponse(
              runewordId, safeText(runeword.getName()), metadata.getBases(), crafted));
      foundCount = crafted ? 1 : 0;
    }

    int totalItems = checklist.size();
    String description = buildRunewordDescription(metadata);

    return new CollectionSummaryResponse(
        slugify(runeword.getName()),
        safeText(runeword.getName()),
        "runeword",
        StringUtils.hasText(description) ? description : null,
        totalItems,
        foundCount,
        checklist);
  }

  private RunewordMetadata parseRunewordMetadata(
      Item runeword, List<ItemProperty> runewordProperties) {
    String bases = runeword.getType();
    if (!StringUtils.hasText(bases)) {
      bases =
          runewordProperties.stream()
              .filter(prop -> equalsIgnoreCase(prop.getPropertyName(), "Runeword Bases"))
              .map(ItemProperty::getPropertyValue)
              .filter(StringUtils::hasText)
              .findFirst()
              .orElse(null);
    }

    String details = runeword.getDescription();
    if (!StringUtils.hasText(details)) {
      details =
          runewordProperties.stream()
              .filter(prop -> equalsIgnoreCase(prop.getPropertyName(), "Runeword Details"))
              .map(ItemProperty::getPropertyValue)
              .filter(StringUtils::hasText)
              .findFirst()
              .orElse(null);
    }

    List<String> runes = new ArrayList<>();
    String sockets = null;
    String highestRune = null;
    String ladder = null;

    if (StringUtils.hasText(details)) {
      List<String> parsedRunes = Collections.emptyList();
      String[] segments = details.split("\\|");
      for (String segment : segments) {
        String trimmed = segment.trim();
        if (!StringUtils.hasText(trimmed)) {
          continue;
        }
        int colonIndex = trimmed.indexOf(':');
        if (colonIndex < 0) {
          continue;
        }
        String key = trimmed.substring(0, colonIndex).trim().toLowerCase(Locale.ROOT);
        String value = trimmed.substring(colonIndex + 1).trim();
        switch (key) {
          case "runes" -> parsedRunes = parseRunes(value);
          case "sockets" -> sockets = value;
          case "highest rune" -> highestRune = value;
          case "ladder" -> ladder = value;
          default -> {
            // ignore other keys
          }
        }
      }
      if (!parsedRunes.isEmpty()) {
        runes = new ArrayList<>(parsedRunes);
      }
    }

    return new RunewordMetadata(
        Collections.unmodifiableList(runes), sockets, highestRune, ladder, bases);
  }

  private List<String> parseRunes(String raw) {
    if (!StringUtils.hasText(raw)) {
      return Collections.emptyList();
    }
    return Arrays.stream(raw.split("\\+"))
        .map(String::trim)
        .filter(StringUtils::hasText)
        .collect(Collectors.toList());
  }

  private String buildRunewordDescription(RunewordMetadata metadata) {
    List<String> parts = new ArrayList<>();
    if (StringUtils.hasText(metadata.getBases())) {
      parts.add(metadata.getBases());
    }
    if (StringUtils.hasText(metadata.getSockets())) {
      parts.add("Sockets: " + metadata.getSockets());
    }
    if (StringUtils.hasText(metadata.getHighestRune())) {
      parts.add("Highest rune: " + metadata.getHighestRune());
    }
    if (StringUtils.hasText(metadata.getLadder())) {
      parts.add("Ladder: " + metadata.getLadder());
    }
    return String.join(" • ", parts);
  }

  private boolean equalsIgnoreCase(String left, String right) {
    return left != null && right != null && left.equalsIgnoreCase(right);
  }

  private String safeText(String value) {
    return StringUtils.hasText(value) ? value : "Runeword";
  }

  private static class RunewordMetadata {
    private final List<String> runes;
    private final String sockets;
    private final String highestRune;
    private final String ladder;
    private final String bases;

    RunewordMetadata(
        List<String> runes, String sockets, String highestRune, String ladder, String bases) {
      this.runes = runes;
      this.sockets = sockets;
      this.highestRune = highestRune;
      this.ladder = ladder;
      this.bases = bases;
    }

    List<String> getRunes() {
      return runes;
    }

    String getSockets() {
      return sockets;
    }

    String getHighestRune() {
      return highestRune;
    }

    String getLadder() {
      return ladder;
    }

    String getBases() {
      return bases;
    }
  }

  private CollectionItemResponse toCollectionItem(Item item, Set<Long> foundItemIds) {
    Long itemId = item.getId();
    boolean found = itemId != null && foundItemIds.contains(itemId);
    String slot = item.getType();
    return new CollectionItemResponse(itemId, item.getName(), slot, found);
  }

  private Set<Long> resolveFoundItemIds(Long userId) {
    List<UserItem> userItems;
    if (userId != null) {
      userItems = userItemRepository.findByUserId(userId);
    } else {
      userItems = userItemRepository.findAll();
    }

    return userItems.stream()
        .map(UserItem::getItem)
        .filter(Objects::nonNull)
        .map(Item::getId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
  }

  private String slugify(String value) {
    if (!StringUtils.hasText(value)) {
      return "collection";
    }
    String lower = value.toLowerCase(Locale.ROOT);
    String slug = lower.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return StringUtils.hasText(slug) ? slug : "collection";
  }
}
