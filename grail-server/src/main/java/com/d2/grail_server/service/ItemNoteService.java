package com.d2.grail_server.service;

import com.d2.grail_server.dto.ItemNoteRequest;
import com.d2.grail_server.dto.ItemNoteResponse;
import com.d2.grail_server.exception.ResourceNotFoundException;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.ItemNote;
import com.d2.grail_server.repository.ItemNoteRepository;
import com.d2.grail_server.repository.ItemRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ItemNoteService {

  private final ItemNoteRepository itemNoteRepository;
  private final ItemRepository itemRepository;

  public ItemNoteService(ItemNoteRepository itemNoteRepository, ItemRepository itemRepository) {
    this.itemNoteRepository = itemNoteRepository;
    this.itemRepository = itemRepository;
  }

  @Transactional(readOnly = true)
  public List<ItemNoteResponse> getNotesForItem(Long itemId) {
    return itemNoteRepository.findByItemIdOrderByCreatedAtDesc(itemId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  public ItemNoteResponse createNote(Long itemId, ItemNoteRequest request) {
    Item item =
        itemRepository
            .findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException(String.format("Item %d not found", itemId)));

    ItemNote note = new ItemNote();
    note.setItem(item);
    note.setAuthorName(request.getAuthorName());
    note.setBody(request.getBody());
    note.setCreatedAt(LocalDateTime.now());

    ItemNote saved = itemNoteRepository.save(note);
    return toResponse(saved);
  }

  private ItemNoteResponse toResponse(ItemNote note) {
    return new ItemNoteResponse(
        note.getId(), note.getItem().getId(), note.getAuthorName(), note.getCreatedAt(), note.getBody());
  }
}
