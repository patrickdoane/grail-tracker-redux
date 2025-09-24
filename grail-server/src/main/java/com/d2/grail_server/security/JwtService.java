package com.d2.grail_server.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final Key signingKey;
  private final long expirationMinutes;

  public JwtService(
      @Value("${auth.jwt.secret}") String secret,
      @Value("${auth.jwt.expiration-minutes:240}") long expirationMinutes) {
    this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    this.expirationMinutes = expirationMinutes;
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public String generateToken(UserDetails userDetails) {
    return generateToken(Collections.emptyMap(), userDetails);
  }

  public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
    Instant now = Instant.now();
    Instant expiry = now.plus(expirationMinutes, ChronoUnit.MINUTES);
    return Jwts.builder()
        .setClaims(extraClaims)
        .setSubject(userDetails.getUsername())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiry))
        .signWith(signingKey, SignatureAlgorithm.HS256)
        .compact();
  }

  public boolean isTokenValid(String token, UserDetails userDetails) {
    String username = extractUsername(token);
    return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
  }

  private boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }

  private Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    Claims claims =
        Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
    return claimsResolver.apply(claims);
  }
}
