package com.d2.grail_server.controller;

import com.d2.grail_server.dto.DataConnectorActionRequest;
import com.d2.grail_server.dto.DataConnectorResponse;
import com.d2.grail_server.dto.SyncJobResponse;
import com.d2.grail_server.service.DataConnectorService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data-connectors")
public class DataConnectorController {
  private final DataConnectorService dataConnectorService;

  public DataConnectorController(DataConnectorService dataConnectorService) {
    this.dataConnectorService = dataConnectorService;
  }

  @GetMapping
  public List<DataConnectorResponse> listConnectors() {
    return dataConnectorService.getConnectors();
  }

  @PostMapping("/{connectorId}/actions")
  public SyncJobResponse triggerAction(
      @PathVariable String connectorId, @Valid @RequestBody DataConnectorActionRequest request) {
    return dataConnectorService.triggerAction(connectorId, request);
  }
}
