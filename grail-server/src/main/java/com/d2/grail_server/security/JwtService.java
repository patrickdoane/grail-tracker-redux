package com.d2.grail_server.security;

import com.d2.grail_server.config.AppSecurityProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.function.Function;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private static final long ACCESS_TOKEN_TTL_MINUTES = 60L;

  private final AppSecurityProperties appSecurityProperties;

  public JwtService(AppSecurityProperties appSecurityProperties) {
    this.appSecurityProperties = appSecurityProperties;
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    Claims claims = parseToken(token);
    return claimsResolver.apply(claims);
  }

  public String generateToken(UserDetails userDetails) {
    Instant now = Instant.now();
    Instant expiration = now.plus(ACCESS_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES);
    return Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiration))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public boolean isTokenValid(String token, UserDetails userDetails) {
    String username = extractUsername(token);
    return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
  }

  private boolean isTokenExpired(String token) {
    Date expiration = extractClaim(token, Claims::getExpiration);
    return expiration.before(new Date());
  }

  private Claims parseToken(String token) {
    return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
  }

  private Key getSigningKey() {
    try {
      byte[] keyBytes = Decoders.BASE64.decode(appSecurityProperties.getJwtSecret());
      return Keys.hmacShaKeyFor(keyBytes);
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException(
          "Invalid JWT secret configuration. Provide a Base64-encoded value via app.security.jwt-secret.",
          ex);
    }
  }
}
