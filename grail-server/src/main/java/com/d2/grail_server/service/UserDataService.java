package com.d2.grail_server.service;

import com.d2.grail_server.dto.SyncJobResponse;
import com.d2.grail_server.dto.UserDataExportResponse;
import com.d2.grail_server.dto.UserDataImportResponse;
import com.d2.grail_server.model.SyncJob;
import com.d2.grail_server.model.SyncJobStatus;
import com.d2.grail_server.model.SyncJobType;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class UserDataService {
  private final SyncJobService syncJobService;

  public UserDataService(SyncJobService syncJobService) {
    this.syncJobService = syncJobService;
  }

  public UserDataImportResponse importData(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(BAD_REQUEST, "No import file provided");
    }

    String content;
    try {
      content = new String(file.getBytes(), StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new ResponseStatusException(BAD_REQUEST, "Unable to read import file", ex);
    }

    SyncJob job = syncJobService.startJob(SyncJobType.IMPORT, null, "Parsing import payload");
    boolean conflicts = content.toLowerCase().contains("conflict");

    if (conflicts) {
      job = syncJobService.failJob(job, "Conflicts detected. Review details before retrying.");
    } else {
      long count =
          Arrays.stream(content.split("\\R"))
              .map(String::trim)
              .filter(line -> !line.isEmpty())
              .count();
      int recordCount = (int) Math.max(1, count);
      job = syncJobService.completeJob(job, String.format("Imported %d records", recordCount));
    }

    UserDataImportResponse response = new UserDataImportResponse();
    response.setJob(syncJobService.toResponse(job));
    response.setConflictsDetected(conflicts);
    return response;
  }

  public UserDataImportResponse retryImport(Long jobId) {
    SyncJob previous =
        syncJobService
            .getJob(jobId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Import job not found"));

    SyncJob job = syncJobService.startJob(SyncJobType.IMPORT, previous.getConnectorSlug(), "Retrying import");
    job.setRetryCount(previous.getRetryCount() + 1);
    job.setUpdatedAt(LocalDateTime.now());
    job = syncJobService.completeJob(job, "Import retried successfully");

    UserDataImportResponse response = new UserDataImportResponse();
    response.setJob(syncJobService.toResponse(job));
    response.setConflictsDetected(false);
    return response;
  }

  public UserDataExportResponse startExport(String format) {
    if (format == null || format.trim().isEmpty()) {
      format = "csv";
    }

    SyncJob job = syncJobService.startJob(SyncJobType.EXPORT, null, "Generating export");
    job = syncJobService.completeJob(job, String.format("Export ready (%s)", format));

    UserDataExportResponse response = new UserDataExportResponse();
    response.setJob(syncJobService.toResponse(job));
    response.setDownloadUrl(String.format("/api/user-data/export/%d/download?format=%s", job.getId(), format));
    return response;
  }

  public Resource downloadExport(Long jobId, String format) {
    SyncJob job =
        syncJobService
            .getJob(jobId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Export job not found"));

    if (job.getStatus() != SyncJobStatus.COMPLETED) {
      throw new ResponseStatusException(BAD_REQUEST, "Export is still in progress");
    }

    String safeFormat =
        (format == null || format.trim().isEmpty()) ? "csv" : format.toLowerCase();
    String header = "type,name,rarity,notes";
    List<String> rows =
        Arrays.asList(
            "item,Harlequin Crest,Unique,Found in Chaos Sanctuary",
            "rune,Zod,High,Still missing",
            "runeword,Enigma,Runeword,Completed last ladder");
    String body = String.join("\n", rows);
    String payload = header + "\n" + body;

    if ("json".equals(safeFormat)) {
      payload =
          "{" +
          "\"items\":[" +
          "{\"type\":\"item\",\"name\":\"Harlequin Crest\",\"rarity\":\"Unique\"}," +
          "{\"type\":\"rune\",\"name\":\"Zod\",\"rarity\":\"High\"}," +
          "{\"type\":\"runeword\",\"name\":\"Enigma\",\"rarity\":\"Runeword\"}]" +
          "}";
    }

    return new ByteArrayResource(payload.getBytes(StandardCharsets.UTF_8));
  }

  public SyncJobResponse getJob(Long jobId) {
    return syncJobService
        .getJob(jobId)
        .map(syncJobService::toResponse)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Job not found"));
  }
}
