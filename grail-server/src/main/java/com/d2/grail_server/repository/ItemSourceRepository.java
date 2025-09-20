package com.d2.grail_server.repository;

import com.d2.grail_server.model.ItemSource;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemSourceRepository extends JpaRepository<ItemSource, Long> {
  List<ItemSource> findByItemId(Long itemId);
}
