package com.d2.grail_server.dto;

public class UserDataImportResponse {
  private SyncJobResponse job;
  private boolean conflictsDetected;

  public SyncJobResponse getJob() {
    return job;
  }

  public void setJob(SyncJobResponse job) {
    this.job = job;
  }

  public boolean isConflictsDetected() {
    return conflictsDetected;
  }

  public void setConflictsDetected(boolean conflictsDetected) {
    this.conflictsDetected = conflictsDetected;
  }
}
