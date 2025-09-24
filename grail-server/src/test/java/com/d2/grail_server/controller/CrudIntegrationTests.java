package com.d2.grail_server.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.d2.grail_server.dto.AuthResponse;
import com.d2.grail_server.dto.ItemNoteRequest;
import com.d2.grail_server.dto.ItemPropertyRequest;
import com.d2.grail_server.dto.ItemRequest;
import com.d2.grail_server.dto.ItemResponse;
import com.d2.grail_server.dto.ItemSourceRequest;
import com.d2.grail_server.dto.RegisterRequest;
import com.d2.grail_server.dto.UserItemRequest;
import com.d2.grail_server.dto.UserRequest;
import com.d2.grail_server.dto.UserResponse;
import com.d2.grail_server.repository.ItemNoteRepository;
import com.d2.grail_server.repository.ItemPropertyRepository;
import com.d2.grail_server.repository.ItemRepository;
import com.d2.grail_server.repository.ItemSourceRepository;
import com.d2.grail_server.repository.UserItemRepository;
import com.d2.grail_server.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CrudIntegrationTests {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @Autowired private UserItemRepository userItemRepository;
  @Autowired private ItemNoteRepository itemNoteRepository;
  @Autowired private ItemPropertyRepository itemPropertyRepository;
  @Autowired private ItemSourceRepository itemSourceRepository;
  @Autowired private ItemRepository itemRepository;
  @Autowired private UserRepository userRepository;

  private String authToken;

  @BeforeEach
  void setUp() throws Exception {
    userItemRepository.deleteAll();
    itemNoteRepository.deleteAll();
    itemPropertyRepository.deleteAll();
    itemSourceRepository.deleteAll();
    itemRepository.deleteAll();
    userRepository.deleteAll();

    authToken = registerTestUser();
  }

  @Test
  void itemCrudFlow() throws Exception {
    ItemRequest createRequest = new ItemRequest();
    createRequest.setName("Shako");
    createRequest.setType("Helm");
    createRequest.setQuality("Unique");
    createRequest.setRarity("Elite");
    createRequest.setDescription("Harlequin Crest");
    createRequest.setD2Version("D2R");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/items")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.name").value("Shako"))
            .andReturn();

    Map<?, ?> createdItem =
        objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
    Long itemId = ((Number) createdItem.get("id")).longValue();

    mockMvc.perform(get("/api/items/{id}", itemId)).andExpect(status().isOk());

    ItemRequest updateRequest = new ItemRequest();
    updateRequest.setName("Shako");
    updateRequest.setType("Helm");
    updateRequest.setQuality("Unique");
    updateRequest.setRarity("Exceptional");
    updateRequest.setDescription("Harlequin Crest");
    updateRequest.setD2Version("D2R");

    mockMvc
        .perform(
            put("/api/items/{id}", itemId)
                .header("Authorization", bearerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rarity").value("Exceptional"));

    MvcResult listResult =
        mockMvc.perform(get("/api/items")).andExpect(status().isOk()).andReturn();
    ItemResponse[] items =
        objectMapper.readValue(listResult.getResponse().getContentAsString(), ItemResponse[].class);
    assertThat(items).hasSize(1);

    mockMvc
        .perform(delete("/api/items/{id}", itemId).header("Authorization", bearerToken()))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/items/{id}", itemId)).andExpect(status().isNotFound());
  }

  @Test
  void itemPropertyAndSourceFlow() throws Exception {
    Long itemId = createItem("Arachnid Mesh");

    ItemPropertyRequest propertyRequest = new ItemPropertyRequest();
    propertyRequest.setItemId(itemId);
    propertyRequest.setPropertyName("Set Name");
    propertyRequest.setPropertyValue("Sazabi's Grand Tribute");

    MvcResult propertyResult =
        mockMvc
            .perform(
                post("/api/item-properties")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(propertyRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.itemId").value(itemId))
            .andReturn();

    Map<?, ?> property =
        objectMapper.readValue(propertyResult.getResponse().getContentAsString(), Map.class);
    Long propertyId = ((Number) property.get("id")).longValue();

    mockMvc
        .perform(get("/api/item-properties").param("itemId", itemId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].propertyName").value("Set Name"));

    ItemSourceRequest sourceRequest = new ItemSourceRequest();
    sourceRequest.setItemId(itemId);
    sourceRequest.setSourceType("wiki");
    sourceRequest.setSourceName("https://diablo2.fandom.com/wiki/Arachnid_Mesh");

    MvcResult sourceResult =
        mockMvc
            .perform(
                post("/api/item-sources")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(sourceRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.sourceType").value("wiki"))
            .andReturn();

    Map<?, ?> source =
        objectMapper.readValue(sourceResult.getResponse().getContentAsString(), Map.class);
    Long sourceId = ((Number) source.get("id")).longValue();

    mockMvc
        .perform(
            delete("/api/item-properties/{id}", propertyId).header("Authorization", bearerToken()))
        .andExpect(status().isNoContent());
    mockMvc
        .perform(delete("/api/item-sources/{id}", sourceId).header("Authorization", bearerToken()))
        .andExpect(status().isNoContent());
  }

  @Test
  void userAndUserItemFlow() throws Exception {
    UserRequest userRequest = new UserRequest();
    userRequest.setUsername("grail_runner");
    userRequest.setEmail("runner@example.com");
    userRequest.setPassword("StrongP@ssw0rd!");

    MvcResult userResult =
        mockMvc
            .perform(
                post("/api/users")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(userRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    UserResponse user =
        objectMapper.readValue(userResult.getResponse().getContentAsString(), UserResponse.class);
    Long userId = user.getId();

    Long itemId = createItem("Herald of Zakarum");

    UserItemRequest createRequest = new UserItemRequest();
    createRequest.setUserId(userId);
    createRequest.setItemId(itemId);
    createRequest.setNotes("Found in Chaos Sanctuary");

    MvcResult userItemResult =
        mockMvc
            .perform(
                post("/api/user-items")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").value(userId))
            .andReturn();

    Map<?, ?> userItem =
        objectMapper.readValue(userItemResult.getResponse().getContentAsString(), Map.class);
    Long userItemId = ((Number) userItem.get("id")).longValue();

    mockMvc
        .perform(get("/api/user-items").param("userId", userId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].itemId").value(itemId));

    UserItemRequest updateRequest = new UserItemRequest();
    updateRequest.setUserId(userId);
    updateRequest.setItemId(itemId);
    updateRequest.setFoundAt(LocalDateTime.of(2024, 1, 1, 12, 0));
    updateRequest.setNotes("Updated note");

    mockMvc
        .perform(
            put("/api/user-items/{id}", userItemId)
                .header("Authorization", bearerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.notes").value("Updated note"));

    mockMvc
        .perform(delete("/api/user-items/{id}", userItemId).header("Authorization", bearerToken()))
        .andExpect(status().isNoContent());
    mockMvc
        .perform(delete("/api/users/{id}", userId).header("Authorization", bearerToken()))
        .andExpect(status().isNoContent());
  }

  @Test
  void itemNotesFlow() throws Exception {
    Long itemId = createItem("Griffon's Eye");

    ItemNoteRequest noteRequest = new ItemNoteRequest();
    noteRequest.setAuthorName("Deckard Cain");
    noteRequest.setBody("Stay awhile and listen.");

    MvcResult createNoteResult =
        mockMvc
            .perform(
                post("/api/items/{itemId}/notes", itemId)
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(noteRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.itemId").value(itemId))
            .andExpect(jsonPath("$.authorName").value("Deckard Cain"))
            .andExpect(jsonPath("$.body").value("Stay awhile and listen."))
            .andReturn();

    Map<?, ?> note =
        objectMapper.readValue(createNoteResult.getResponse().getContentAsString(), Map.class);
    Long noteId = ((Number) note.get("id")).longValue();

    mockMvc
        .perform(get("/api/items/{itemId}/notes", itemId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(noteId));

    mockMvc
        .perform(get("/api/items/{id}/details", itemId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.notes[0].body").value("Stay awhile and listen."));
  }

  private Long createItem(String name) throws Exception {
    ItemRequest request = new ItemRequest();
    request.setName(name);
    request.setType("Armor");
    request.setQuality("Unique");
    request.setRarity("Elite");
    request.setDescription(name + " description");
    request.setD2Version("D2R");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/items")
                    .header("Authorization", bearerToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

    Map<?, ?> created =
        objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
    return ((Number) created.get("id")).longValue();
  }

  private String registerTestUser() throws Exception {
    RegisterRequest request = new RegisterRequest();
    String username = "testuser-" + UUID.randomUUID();
    request.setUsername(username);
    request.setEmail(username + "@example.com");
    request.setPassword("StrongP@ssw0rd!");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

    AuthResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
    return response.getToken();
  }

  private String bearerToken() {
    return "Bearer " + authToken;
  }
}
