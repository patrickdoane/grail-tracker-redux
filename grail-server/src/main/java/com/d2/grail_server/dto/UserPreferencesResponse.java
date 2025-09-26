package com.d2.grail_server.dto;

import com.d2.grail_server.model.UserPreferences.AccentColor;
import com.d2.grail_server.model.UserPreferences.ThemeMode;
import java.time.LocalDateTime;

public class UserPreferencesResponse {
  private Long id;
  private boolean shareProfile;
  private boolean sessionPresence;
  private boolean notifyFinds;
  private ThemeMode themeMode;
  private AccentColor accentColor;
  private boolean enableTooltipContrast;
  private boolean reduceMotion;
  private LocalDateTime updatedAt;
  private long broadcastVersion;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public boolean isShareProfile() {
    return shareProfile;
  }

  public void setShareProfile(boolean shareProfile) {
    this.shareProfile = shareProfile;
  }

  public boolean isSessionPresence() {
    return sessionPresence;
  }

  public void setSessionPresence(boolean sessionPresence) {
    this.sessionPresence = sessionPresence;
  }

  public boolean isNotifyFinds() {
    return notifyFinds;
  }

  public void setNotifyFinds(boolean notifyFinds) {
    this.notifyFinds = notifyFinds;
  }

  public ThemeMode getThemeMode() {
    return themeMode;
  }

  public void setThemeMode(ThemeMode themeMode) {
    this.themeMode = themeMode;
  }

  public AccentColor getAccentColor() {
    return accentColor;
  }

  public void setAccentColor(AccentColor accentColor) {
    this.accentColor = accentColor;
  }

  public boolean isEnableTooltipContrast() {
    return enableTooltipContrast;
  }

  public void setEnableTooltipContrast(boolean enableTooltipContrast) {
    this.enableTooltipContrast = enableTooltipContrast;
  }

  public boolean isReduceMotion() {
    return reduceMotion;
  }

  public void setReduceMotion(boolean reduceMotion) {
    this.reduceMotion = reduceMotion;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public long getBroadcastVersion() {
    return broadcastVersion;
  }

  public void setBroadcastVersion(long broadcastVersion) {
    this.broadcastVersion = broadcastVersion;
  }
}
