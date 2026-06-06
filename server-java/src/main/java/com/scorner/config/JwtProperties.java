package com.scorner.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** HS256 secret, at least 32 bytes recommended */
    private String secret = "dev-only-change-me-in-production-32chars";

    private int expiryHours = 168;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public int getExpiryHours() { return expiryHours; }
    public void setExpiryHours(int expiryHours) { this.expiryHours = expiryHours; }
}
