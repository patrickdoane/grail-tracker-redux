package com.d2.grail_server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.d2.grail_server.dto.UserItemRequest;
import com.d2.grail_server.dto.UserItemResponse;
import com.d2.grail_server.model.Item;
import com.d2.grail_server.model.User;
import com.d2.grail_server.model.UserItem;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.UserItemRepository;
import com.d2.grail_server.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserItemServiceTests {

  @Mock private UserItemRepository userItemRepository;
  @Mock private UserRepository userRepository;
  @Mock private ItemRepository itemRepository;

  @InjectMocks private UserItemService userItemService;

  @Test
  void createUserItemAllowsRuneQualityItems() {
    User user = new User();
    user.setId(42L);

    Item rune = new Item();
    rune.setId(100L);
    rune.setQuality("Rune");

    UserItemRequest request = new UserItemRequest();
    request.setUserId(42L);
    request.setItemId(100L);

    when(userRepository.findById(eq(42L))).thenReturn(Optional.of(user));
    when(itemRepository.findById(eq(100L))).thenReturn(Optional.of(rune));
    when(userItemRepository.save(any(UserItem.class)))
        .thenAnswer(
            invocation -> {
              UserItem entity = invocation.getArgument(0, UserItem.class);
              entity.setId(5L);
              return entity;
            });

    UserItemResponse response = userItemService.createUserItem(request);

    assertEquals(5L, response.getId());
    assertEquals(42L, response.getUserId());
    assertEquals(100L, response.getItemId());
    assertNotNull(response.getFoundAt());

    verify(userItemRepository).save(any(UserItem.class));
  }
}
