package com.d2.grail_server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {
  /**
   * Base64 encoded secret used for signing JWT access tokens. Replace in non-development
   * environments using env-specific overrides (e.g. {@code env.properties}).
   */
  private String jwtSecret =
      "bG9jYWwtZGV2ZWxvcG1lbnQtc2VjcmV0LWtleS1wbGVhc2UtY2hhbmdlIQ==";

  public String getJwtSecret() {
    return jwtSecret;
  }

  public void setJwtSecret(String jwtSecret) {
    this.jwtSecret = jwtSecret;
  }
}
