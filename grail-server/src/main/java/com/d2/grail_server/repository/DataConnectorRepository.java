package com.d2.grail_server.repository;

import com.d2.grail_server.model.DataConnector;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataConnectorRepository extends JpaRepository<DataConnector, Long> {
  Optional<DataConnector> findBySlug(String slug);

  List<DataConnector> findAllByOrderByDisplayOrderAsc();
}
