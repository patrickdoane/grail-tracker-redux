package com.d2.grail_server;

import com.d2.grail_server.config.AppSecurityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppSecurityProperties.class)
public class GrailServerApplication {

  public static void main(String[] args) {
    SpringApplication.run(GrailServerApplication.class, args);
  }
}
