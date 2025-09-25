package com.d2.grail_server.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.d2.grail_server.dto.UserPreferencesRequest;
import com.d2.grail_server.dto.UserProfileRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SettingsIntegrationTests {
  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @BeforeEach
  void resetState() throws Exception {
    // Warm up profile/preferences endpoints to ensure defaults exist
    mockMvc.perform(get("/api/user-profile")).andExpect(status().isOk());
    mockMvc.perform(get("/api/user-preferences")).andExpect(status().isOk());
  }

  @Test
  void settingsPersistenceFlow() throws Exception {
    mockMvc
        .perform(
            put("/api/user-profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Aster\",\"tagline\":\"Hunt\",\"email\":\"aster@example.com\",\"timezone\":\"Invalid/Zone\"}"))
        .andExpect(status().isBadRequest());

    UserProfileRequest profileRequest = new UserProfileRequest();
    profileRequest.setDisplayName("Aster the Grail Seeker");
    profileRequest.setTagline("Hunting every unique drop.");
    profileRequest.setEmail("aster@grail.example");
    profileRequest.setTimezone("America/Chicago");

    mockMvc
        .perform(
            put("/api/user-profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Aster the Grail Seeker"));

    MvcResult preferencesResult = mockMvc.perform(get("/api/user-preferences")).andExpect(status().isOk()).andReturn();
    JsonNode preferencesNode = objectMapper.readTree(preferencesResult.getResponse().getContentAsString());
    long initialVersion = preferencesNode.get("broadcastVersion").asLong();

    UserPreferencesRequest preferencesRequest = new UserPreferencesRequest();
    preferencesRequest.setShareProfile(true);
    preferencesRequest.setSessionPresence(true);
    preferencesRequest.setNotifyFinds(true);
    preferencesRequest.setThemeMode(com.d2.grail_server.model.UserPreferences.ThemeMode.DARK);
    preferencesRequest.setAccentColor(com.d2.grail_server.model.UserPreferences.AccentColor.ARCANE);
    preferencesRequest.setEnableTooltipContrast(true);
    preferencesRequest.setReduceMotion(true);

    mockMvc
        .perform(
            put("/api/user-preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.broadcastVersion").value(initialVersion + 1));

    mockMvc
        .perform(get("/api/data-connectors"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("cloud-backup"))
        .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(3)));

    mockMvc
        .perform(
            post("/api/data-connectors/{id}/actions", "cloud-backup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"manage\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("COMPLETED"));

    MockMultipartFile conflictFile =
        new MockMultipartFile(
            "file", "conflict.csv", "text/csv", "id,name\n1,CONFLICT_ITEM".getBytes());

    MvcResult conflictResult =
        mockMvc
            .perform(multipart("/api/user-data/import").file(conflictFile))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.conflictsDetected").value(true))
            .andExpect(jsonPath("$.job.status").value("FAILED"))
            .andReturn();

    JsonNode conflictNode = objectMapper.readTree(conflictResult.getResponse().getContentAsString());
    long conflictJobId = conflictNode.get("job").get("id").asLong();

    mockMvc
        .perform(post("/api/user-data/import/{jobId}/retry", conflictJobId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.conflictsDetected").value(false))
        .andExpect(jsonPath("$.job.status").value("COMPLETED"));

    MvcResult exportResult =
        mockMvc
            .perform(post("/api/user-data/export").param("format", "csv"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.job.status").value("COMPLETED"))
            .andReturn();

    JsonNode exportNode = objectMapper.readTree(exportResult.getResponse().getContentAsString());
    long exportJobId = exportNode.get("job").get("id").asLong();
    String downloadUrl = exportNode.get("downloadUrl").asText();
    assertThat(downloadUrl).contains("/api/user-data/export/" + exportJobId);

    mockMvc
        .perform(get("/api/user-data/export/{jobId}/download", exportJobId))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("grail-export-")));

    MvcResult onboardingResult = mockMvc.perform(get("/api/onboarding/tasks"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tasks", org.hamcrest.Matchers.hasSize(4)))
        .andReturn();

    JsonNode onboardingNode = objectMapper.readTree(onboardingResult.getResponse().getContentAsString());
    assertThat(onboardingNode.get("completionPercent").asInt()).isGreaterThanOrEqualTo(50);

    mockMvc
        .perform(
            post("/api/onboarding/tasks/{taskId}", "share-progress")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"completed\":true}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completed").value(true));
  }
}
