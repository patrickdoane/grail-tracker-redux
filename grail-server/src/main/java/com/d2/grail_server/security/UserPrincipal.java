package com.d2.grail_server.security;

import com.d2.grail_server.model.User;
import com.d2.grail_server.model.UserRole;
import java.util.Collection;
import java.util.Collections;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserPrincipal implements UserDetails {

  private final Long id;
  private final String username;
  private final String password;
  private final Collection<? extends GrantedAuthority> authorities;

  private UserPrincipal(Long id, String username, String password, UserRole role) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.authorities =
        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
  }

  public static UserPrincipal fromUser(User user) {
    return new UserPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), user.getRole());
  }

  public Long getId() {
    return id;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return password;
  }

  @Override
  public String getUsername() {
    return username;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }
}
