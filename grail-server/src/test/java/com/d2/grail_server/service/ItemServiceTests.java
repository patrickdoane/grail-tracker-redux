package com.d2.grail_server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.d2.grail_server.dto.ItemDetailResponse;
import com.d2.grail_server.dto.ItemVariantResponse;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.repository.ItemNoteRepository;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.ItemSourceRepository;
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
}
