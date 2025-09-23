package com.d2.grail_server.controller;

import com.d2.grail_server.dto.ItemNoteRequest;
import com.d2.grail_server.dto.ItemNoteResponse;
import com.d2.grail_server.service.ItemNoteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items/{itemId}/notes")
public class ItemNoteController {

  private final ItemNoteService itemNoteService;

  public ItemNoteController(ItemNoteService itemNoteService) {
    this.itemNoteService = itemNoteService;
  }

  @GetMapping
  public List<ItemNoteResponse> getNotes(@PathVariable Long itemId) {
    return itemNoteService.getNotesForItem(itemId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ItemNoteResponse createNote(
      @PathVariable Long itemId, @Valid @RequestBody ItemNoteRequest request) {
    return itemNoteService.createNote(itemId, request);
  }
}
