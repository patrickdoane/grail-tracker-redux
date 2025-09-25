package com.d2.grail_server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "profile_id", nullable = false, unique = true)
  private UserProfile profile;

  @Column(nullable = false)
  private boolean shareProfile = true;

  @Column(nullable = false)
  private boolean sessionPresence = true;

  @Column(nullable = false)
  private boolean notifyFinds = false;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ThemeMode themeMode = ThemeMode.SYSTEM;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AccentColor accentColor = AccentColor.EMBER;

  @Column(nullable = false)
  private boolean enableTooltipContrast = true;

  @Column(nullable = false)
  private boolean reduceMotion = false;

  @Column(nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();

  @Column(nullable = false)
  private long broadcastVersion = 0L;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public UserProfile getProfile() {
    return profile;
  }

  public void setProfile(UserProfile profile) {
    this.profile = profile;
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

  public enum ThemeMode {
    SYSTEM,
    DARK,
    LIGHT,
    HIGH_CONTRAST
  }

  public enum AccentColor {
    EMBER,
    ARCANE,
    GILDED
  }
}
