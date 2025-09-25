package com.d2.grail_server.service;

import com.d2.grail_server.dto.DataConnectorActionRequest;
import com.d2.grail_server.dto.DataConnectorResponse;
import com.d2.grail_server.dto.SyncJobResponse;
import com.d2.grail_server.model.DataConnector;
import com.d2.grail_server.model.DataConnector.StatusVariant;
import com.d2.grail_server.model.SyncJobType;
import com.d2.grail_server.repository.DataConnectorRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class DataConnectorService {
  private final DataConnectorRepository dataConnectorRepository;
  private final SyncJobService syncJobService;

  public DataConnectorService(
      DataConnectorRepository dataConnectorRepository, SyncJobService syncJobService) {
    this.dataConnectorRepository = dataConnectorRepository;
    this.syncJobService = syncJobService;
  }

  public List<DataConnectorResponse> getConnectors() {
    bootstrapDefaults();
    return dataConnectorRepository.findAllByOrderByDisplayOrderAsc().stream()
        .map(this::toResponse)
        .toList();
  }

  public SyncJobResponse triggerAction(String connectorId, DataConnectorActionRequest request) {
    bootstrapDefaults();
    DataConnector connector =
        dataConnectorRepository
            .findBySlug(connectorId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Connector not found"));

    String action = request.getAction().toLowerCase(Locale.ROOT);
    SyncJob job;
    LocalDateTime now = LocalDateTime.now();

    switch (action) {
      case "manage":
        job = syncJobService.startJob(SyncJobType.CONNECTOR_SYNC, connector.getSlug(), "Reconciling connection");
        connector.setStatusVariant(StatusVariant.SUCCESS);
        connector.setStatusMessage("Connected");
        connector.setLastSyncSummary("Synced just now");
        connector.setNextSyncSummary("Autosync in 15 minutes");
        connector.setUpdatedAt(now);
        job = syncJobService.completeJob(job, "Connection refreshed successfully");
        break;
      case "schedule":
        job = syncJobService.startJob(SyncJobType.CONNECTOR_SYNC, connector.getSlug(), "Updating export schedule");
        connector.setStatusVariant(StatusVariant.INFO);
        connector.setStatusMessage("Scheduled");
        connector.setLastSyncSummary("Next run at 02:00 local time");
        connector.setNextSyncSummary("Nightly backups confirmed");
        connector.setUpdatedAt(now);
        job = syncJobService.completeJob(job, "Nightly export scheduled");
        break;
      case "import":
        job = syncJobService.startJob(SyncJobType.CONNECTOR_SYNC, connector.getSlug(), "Preparing import");
        connector.setStatusVariant(StatusVariant.WARNING);
        connector.setStatusMessage("Awaiting file");
        connector.setLastSyncSummary("Last merged 3 sessions ago");
        connector.setNextSyncSummary("Ready for manual import");
        connector.setUpdatedAt(now);
        job = syncJobService.completeJob(job, "Importer launched");
        break;
      case "sync":
        job = syncJobService.startJob(SyncJobType.CONNECTOR_SYNC, connector.getSlug(), "Manual sync triggered");
        connector.setStatusVariant(StatusVariant.INFO);
        connector.setStatusMessage("Syncing");
        connector.setLastSyncSummary("Sync running now");
        connector.setNextSyncSummary("Next autosync shortly");
        connector.setUpdatedAt(now);
        job = syncJobService.completeJob(job, "Manual sync completed");
        break;
      default:
        throw new ResponseStatusException(BAD_REQUEST, "Unsupported connector action");
    }

    dataConnectorRepository.save(connector);
    return syncJobService.toResponse(job);
  }

  private void bootstrapDefaults() {
    if (dataConnectorRepository.count() > 0) {
      return;
    }

    List<DataConnector> seeds = new ArrayList<>();

    DataConnector cloud = new DataConnector();
    cloud.setSlug("cloud-backup");
    cloud.setLabel("Grail Cloud backup");
    cloud.setDescription(
        "Persist finds to the hosted service. Mirrors the upcoming /api/user-items endpoints.");
    cloud.setStatusVariant(StatusVariant.SUCCESS);
    cloud.setStatusMessage("Connected");
    cloud.setLastSyncSummary("Synced 12 minutes ago");
    cloud.setNextSyncSummary("Autosync in 15 minutes");
    cloud.setActionLabel("Manage connection");
    cloud.setDisplayOrder(0);
    seeds.add(cloud);

    DataConnector local = new DataConnector();
    local.setSlug("local-archive");
    local.setLabel("Local archive exports");
    local.setDescription(
        "Generate encrypted JSON + CSV bundles for offline storage and version history.");
    local.setStatusVariant(StatusVariant.INFO);
    local.setStatusMessage("Scheduled nightly");
    local.setLastSyncSummary("Next run at 02:00 local time");
    local.setNextSyncSummary("Change schedule");
    local.setActionLabel("Open schedule");
    local.setDisplayOrder(1);
    seeds.add(local);

    DataConnector d2r = new DataConnector();
    d2r.setSlug("d2r-import");
    d2r.setLabel("Diablo II save import");
    d2r.setDescription("Upload the latest offline save to merge rune ownership and grail finds.");
    d2r.setStatusVariant(StatusVariant.WARNING);
    d2r.setStatusMessage("Awaiting file");
    d2r.setLastSyncSummary("Last merged 3 sessions ago");
    d2r.setNextSyncSummary("Ready when you are");
    d2r.setActionLabel("Launch importer");
    d2r.setDisplayOrder(2);
    seeds.add(d2r);

    dataConnectorRepository.saveAll(seeds);
  }

  private DataConnectorResponse toResponse(DataConnector connector) {
    DataConnectorResponse response = new DataConnectorResponse();
    response.setId(connector.getSlug());
    response.setLabel(connector.getLabel());
    response.setDescription(connector.getDescription());
    response.setStatusVariant(connector.getStatusVariant());
    response.setStatusMessage(connector.getStatusMessage());
    response.setLastSyncSummary(connector.getLastSyncSummary());
    response.setNextSyncSummary(connector.getNextSyncSummary());
    response.setActionLabel(connector.getActionLabel());
    response.setUpdatedAt(connector.getUpdatedAt());
    return response;
  }
}
