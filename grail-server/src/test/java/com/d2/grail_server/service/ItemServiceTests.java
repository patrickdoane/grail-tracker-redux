package com.d2.grail_server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.d2.grail_server.dto.ItemDetailResponse;
import com.d2.grail_server.dto.ItemVariantResponse;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemProperty;
import com.d2.grail_server.repository.ItemNoteRepository;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.ItemSourceRepository;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ItemServiceTests {

  @Mock private ItemRepository itemRepository;
  @Mock private ItemPropertyRepository itemPropertyRepository;
  @Mock private ItemSourceRepository itemSourceRepository;
  @Mock private ItemNoteRepository itemNoteRepository;

  @InjectMocks private ItemService itemService;

  @Test
  void getItemDetailBuildsFallbackVariantWhenItemDescriptionPresent() {
    Item item = new Item();
    item.setId(1L);
    item.setName("Shiny Saber");
    item.setDescription("Legendary blade that hums softly.");

    when(itemRepository.findById(eq(1L))).thenReturn(Optional.of(item));
    when(itemPropertyRepository.findByItemId(eq(1L))).thenReturn(Collections.emptyList());
    when(itemSourceRepository.findByItemId(eq(1L))).thenReturn(Collections.emptyList());
    when(itemNoteRepository.findByItemIdOrderByCreatedAtDesc(eq(1L)))
        .thenReturn(Collections.emptyList());

    ItemDetailResponse detail = itemService.getItemDetail(1L);

    assertEquals(1, detail.getVariants().size());
    ItemVariantResponse variant = detail.getVariants().get(0);
    assertEquals("Shiny Saber", variant.getLabel());
    assertEquals("Legendary blade that hums softly.", variant.getDescription());
    assertTrue(variant.getAttributes().isEmpty());
  }

  @Test
  void getItemDetailUsesVariantPropertiesWhenPresent() {
    Item item = new Item();
    item.setId(2L);
    item.setName("Runic Shroud");
    item.setDescription("Base description should not become the variant.");

    ItemProperty variantDescription = new ItemProperty();
    variantDescription.setItem(item);
    variantDescription.setPropertyName("Variant: Ladder");
    variantDescription.setPropertyValue("Socketed (2)");

    ItemProperty variantAttribute = new ItemProperty();
    variantAttribute.setItem(item);
    variantAttribute.setPropertyName("Variant: Ladder");
    variantAttribute.setPropertyValue("Enhanced Damage");

    when(itemRepository.findById(eq(2L))).thenReturn(Optional.of(item));
    when(itemPropertyRepository.findByItemId(eq(2L)))
        .thenReturn(Arrays.asList(variantDescription, variantAttribute));
    when(itemSourceRepository.findByItemId(eq(2L))).thenReturn(Collections.emptyList());
    when(itemNoteRepository.findByItemIdOrderByCreatedAtDesc(eq(2L)))
        .thenReturn(Collections.emptyList());

    ItemDetailResponse detail = itemService.getItemDetail(2L);

    assertEquals(1, detail.getVariants().size());
    ItemVariantResponse variant = detail.getVariants().get(0);
    assertEquals("Ladder", variant.getLabel());
    assertEquals("Socketed (2)", variant.getDescription());
    assertEquals(Collections.singletonList("Enhanced Damage"), variant.getAttributes());
  }

  @Test
  void getItemDetailGroupsMultipleVariantLabels() {
    Item item = new Item();
    item.setId(3L);
    item.setName("Ancient Relic");
    item.setDescription("Fallback text should be ignored when variants exist.");

    ItemProperty ladderDescription = new ItemProperty();
    ladderDescription.setItem(item);
    ladderDescription.setPropertyName("Variant: Ladder");
    ladderDescription.setPropertyValue("Ladder-only bonus");

    ItemProperty ladderAttribute = new ItemProperty();
    ladderAttribute.setItem(item);
    ladderAttribute.setPropertyName("Variant: Ladder");
    ladderAttribute.setPropertyValue("+1 to Skills");

    ItemProperty hardcoreDescription = new ItemProperty();
    hardcoreDescription.setItem(item);
    hardcoreDescription.setPropertyName("Variant: Hardcore");
    hardcoreDescription.setPropertyValue("Cannot die");

    ItemProperty hardcoreAttribute = new ItemProperty();
    hardcoreAttribute.setItem(item);
    hardcoreAttribute.setPropertyName("Variant: Hardcore");
    hardcoreAttribute.setPropertyValue("Extra Life");

    when(itemRepository.findById(eq(3L))).thenReturn(Optional.of(item));
    when(itemPropertyRepository.findByItemId(eq(3L)))
        .thenReturn(
            Arrays.asList(
                ladderDescription, ladderAttribute, hardcoreDescription, hardcoreAttribute));
    when(itemSourceRepository.findByItemId(eq(3L))).thenReturn(Collections.emptyList());
    when(itemNoteRepository.findByItemIdOrderByCreatedAtDesc(eq(3L)))
        .thenReturn(Collections.emptyList());

    ItemDetailResponse detail = itemService.getItemDetail(3L);

    assertEquals(2, detail.getVariants().size());

    ItemVariantResponse ladderVariant = detail.getVariants().get(0);
    ItemVariantResponse hardcoreVariant = detail.getVariants().get(1);

    assertEquals("Ladder", ladderVariant.getLabel());
    assertEquals("Ladder-only bonus", ladderVariant.getDescription());
    assertEquals(Collections.singletonList("+1 to Skills"), ladderVariant.getAttributes());

    assertEquals("Hardcore", hardcoreVariant.getLabel());
    assertEquals("Cannot die", hardcoreVariant.getDescription());
    assertEquals(Collections.singletonList("Extra Life"), hardcoreVariant.getAttributes());
  }

  @Test
  void getItemDetailMergesDuplicateVariantEntries() {
    Item item = new Item();
    item.setId(4L);
    item.setName("Mirror Shard");

    ItemProperty first = new ItemProperty();
    first.setItem(item);
    first.setPropertyName("Variant: Maze");
    first.setPropertyValue("First drop");

    ItemProperty second = new ItemProperty();
    second.setItem(item);
    second.setPropertyName("Variant: Maze");
    second.setPropertyValue("+5% FCR");

    ItemProperty third = new ItemProperty();
    third.setItem(item);
    third.setPropertyName("Variant: Maze");
    third.setPropertyValue("Cold Resist");

    when(itemRepository.findById(eq(4L))).thenReturn(Optional.of(item));
    when(itemPropertyRepository.findByItemId(eq(4L)))
        .thenReturn(Arrays.asList(first, second, third));
    when(itemSourceRepository.findByItemId(eq(4L))).thenReturn(Collections.emptyList());
    when(itemNoteRepository.findByItemIdOrderByCreatedAtDesc(eq(4L)))
        .thenReturn(Collections.emptyList());

    ItemDetailResponse detail = itemService.getItemDetail(4L);

    assertEquals(1, detail.getVariants().size());
    ItemVariantResponse variant = detail.getVariants().get(0);
    assertEquals("Maze", variant.getLabel());
    assertEquals("First drop", variant.getDescription());
    assertEquals(Arrays.asList("+5% FCR", "Cold Resist"), variant.getAttributes());
  }

  @Test
  void getItemDetailNormalisesLabelPunctuation() {
    Item item = new Item();
    item.setId(5L);
    item.setName("Storm Crest");

    ItemProperty colonSpacing = new ItemProperty();
    colonSpacing.setItem(item);
    colonSpacing.setPropertyName("Variant : Hardcore");
    colonSpacing.setPropertyValue("Hardcore-safe");

    ItemProperty dashSpacing = new ItemProperty();
    dashSpacing.setItem(item);
    dashSpacing.setPropertyName("Variant- Ladder");
    dashSpacing.setPropertyValue("Ladder bonus");

    when(itemRepository.findById(eq(5L))).thenReturn(Optional.of(item));
    when(itemPropertyRepository.findByItemId(eq(5L)))
        .thenReturn(Arrays.asList(colonSpacing, dashSpacing));
    when(itemSourceRepository.findByItemId(eq(5L))).thenReturn(Collections.emptyList());
    when(itemNoteRepository.findByItemIdOrderByCreatedAtDesc(eq(5L)))
        .thenReturn(Collections.emptyList());

    ItemDetailResponse detail = itemService.getItemDetail(5L);

    assertEquals(2, detail.getVariants().size());
    ItemVariantResponse hardcore = detail.getVariants().get(0);
    ItemVariantResponse ladder = detail.getVariants().get(1);

    assertEquals("Hardcore", hardcore.getLabel());
    assertEquals("Hardcore-safe", hardcore.getDescription());
    assertTrue(hardcore.getAttributes().isEmpty());

    assertEquals("Ladder", ladder.getLabel());
    assertEquals("Ladder bonus", ladder.getDescription());
    assertTrue(ladder.getAttributes().isEmpty());
  }
}
