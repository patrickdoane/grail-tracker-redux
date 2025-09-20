package com.d2.grail_server.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Hibernate maps this model to the user_items table

@Entity
@Table(name = "user_items")
public class UserItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne
  @JoinColumn(name = "item_id", nullable = false)
  private Item item;

  @Column(nullable = false)
  private LocalDateTime foundAt = LocalDateTime.now();

  private String notes;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public Item getItem() {
    return item;
  }

  public void setItem(Item item) {
    this.item = item;
  }

  public LocalDateTime getFoundAt() {
    return foundAt;
  }

  public void setFoundAt(LocalDateTime foundAt) {
    this.foundAt = foundAt;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
