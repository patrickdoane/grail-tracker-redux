package com.d2.grail_server.repository;

import com.d2.grail_server.model.ItemNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemNoteRepository extends JpaRepository<ItemNote, Long> {
  List<ItemNote> findByItemIdOrderByCreatedAtDesc(Long itemId);
}
