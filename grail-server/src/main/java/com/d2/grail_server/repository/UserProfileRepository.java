package com.d2.grail_server.repository;

import com.d2.grail_server.model.UserProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
  Optional<UserProfile> findTopByOrderByUpdatedAtDesc();
}
