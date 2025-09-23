package com.d2.grail_server.repository;

import com.d2.grail_server.model.Item;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
  List<Item> findByQualityIgnoreCase(String quality);
}
