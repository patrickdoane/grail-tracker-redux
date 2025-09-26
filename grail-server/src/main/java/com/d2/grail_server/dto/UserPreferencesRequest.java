package com.d2.grail_server.dto;

import com.d2.grail_server.model.UserPreferences.AccentColor;
import com.d2.grail_server.model.UserPreferences.ThemeMode;
import jakarta.validation.constraints.NotNull;

public class UserPreferencesRequest {
  @NotNull private Boolean shareProfile;
  @NotNull private Boolean sessionPresence;
  @NotNull private Boolean notifyFinds;
  @NotNull private ThemeMode themeMode;
  @NotNull private AccentColor accentColor;
  @NotNull private Boolean enableTooltipContrast;
  @NotNull private Boolean reduceMotion;

  public Boolean getShareProfile() {
    return shareProfile;
  }

  public void setShareProfile(Boolean shareProfile) {
    this.shareProfile = shareProfile;
  }

  public Boolean getSessionPresence() {
    return sessionPresence;
  }

  public void setSessionPresence(Boolean sessionPresence) {
    this.sessionPresence = sessionPresence;
  }

  public Boolean getNotifyFinds() {
    return notifyFinds;
  }

  public void setNotifyFinds(Boolean notifyFinds) {
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

  public Boolean getEnableTooltipContrast() {
    return enableTooltipContrast;
  }

  public void setEnableTooltipContrast(Boolean enableTooltipContrast) {
    this.enableTooltipContrast = enableTooltipContrast;
  }

  public Boolean getReduceMotion() {
    return reduceMotion;
  }

  public void setReduceMotion(Boolean reduceMotion) {
    this.reduceMotion = reduceMotion;
  }
}
