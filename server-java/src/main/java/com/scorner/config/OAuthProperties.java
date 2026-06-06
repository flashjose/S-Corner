package com.scorner.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.oauth")
public class OAuthProperties {

    private String frontendCallbackUrl = "http://localhost:5173/auth/callback";

    private GitHub github = new GitHub();

    public String getFrontendCallbackUrl() { return frontendCallbackUrl; }
    public void setFrontendCallbackUrl(String frontendCallbackUrl) { this.frontendCallbackUrl = frontendCallbackUrl; }
    public GitHub getGithub() { return github; }
    public void setGithub(GitHub github) { this.github = github; }

    public static class GitHub {
        private String clientId = "";
        private String clientSecret = "";

        public boolean isEnabled() {
            return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank();
        }

        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    }
}
