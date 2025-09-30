package com.d2.grail_server.repository;

import com.d2.grail_server.model.UserPreferences;
import com.d2.grail_server.model.UserProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferencesRepository extends JpaRepository<UserPreferences, Long> {
  Optional<UserPreferences> findByProfile(UserProfile profile);
}
