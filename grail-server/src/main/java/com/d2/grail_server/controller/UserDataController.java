package com.d2.grail_server.controller;

import com.d2.grail_server.dto.SyncJobResponse;
import com.d2.grail_server.dto.UserDataExportResponse;
import com.d2.grail_server.dto.UserDataImportResponse;
import com.d2.grail_server.service.UserDataService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user-data")
public class UserDataController {
  private final UserDataService userDataService;

  public UserDataController(UserDataService userDataService) {
    this.userDataService = userDataService;
  }

  @PostMapping("/import")
  public UserDataImportResponse importData(@RequestParam("file") MultipartFile file) {
    return userDataService.importData(file);
  }

  @PostMapping("/import/{jobId}/retry")
  public UserDataImportResponse retryImport(@PathVariable Long jobId) {
    return userDataService.retryImport(jobId);
  }

  @PostMapping("/export")
  public UserDataExportResponse startExport(@RequestParam(value = "format", required = false) String format) {
    return userDataService.startExport(format);
  }

  @GetMapping("/export/{jobId}/download")
  public ResponseEntity<Resource> downloadExport(
      @PathVariable Long jobId, @RequestParam(value = "format", required = false) String format) {
    String safeFormat =
        (format == null || format.trim().isEmpty()) ? "csv" : format;
    Resource resource = userDataService.downloadExport(jobId, safeFormat);
    String filename = String.format("grail-export-%d.%s", jobId, safeFormat);

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(resource);
  }

  @GetMapping("/jobs/{jobId}")
  public SyncJobResponse getJob(@PathVariable Long jobId) {
    return userDataService.getJob(jobId);
  }
}
