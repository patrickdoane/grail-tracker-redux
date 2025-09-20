package com.d2.grail_server.repository;

import com.d2.grail_server.model.UserItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserItemRepository extends JpaRepository<UserItem, Long> {
  List<UserItem> findByUserId(Long userId);

  List<UserItem> findByItemId(Long itemId);
}
