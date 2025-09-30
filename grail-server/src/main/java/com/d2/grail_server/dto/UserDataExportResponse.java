package com.d2.grail_server.dto;

public class UserDataExportResponse {
  private SyncJobResponse job;
  private String downloadUrl;

  public SyncJobResponse getJob() {
    return job;
  }

  public void setJob(SyncJobResponse job) {
    this.job = job;
  }

  public String getDownloadUrl() {
    return downloadUrl;
  }

  public void setDownloadUrl(String downloadUrl) {
    this.downloadUrl = downloadUrl;
  }
}
