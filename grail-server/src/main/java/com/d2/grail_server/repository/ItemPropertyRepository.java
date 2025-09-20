package com.d2.grail_server.repository;

import com.d2.grail_server.model.ItemProperty;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemPropertyRepository extends JpaRepository<ItemProperty, Long> {
  List<ItemProperty> findByItemId(Long itemId);
}
