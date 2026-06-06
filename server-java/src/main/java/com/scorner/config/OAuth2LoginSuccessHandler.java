package com.scorner.config;

import com.scorner.service.AuthService;
import com.scorner.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtService jwtService;
    private final OAuthProperties oauthProperties;

    public OAuth2LoginSuccessHandler(AuthService authService,
                                     JwtService jwtService,
                                     OAuthProperties oauthProperties) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.oauthProperties = oauthProperties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        Object idAttr = oauth2User.getAttribute("id");
        String providerUserId = idAttr != null ? idAttr.toString() : oauth2User.getName();

        var user = authService.findOrCreateOAuthUser(
            "github",
            providerUserId,
            oauth2User.getAttribute("email"),
            oauth2User.getAttribute("name"),
            oauth2User.getAttribute("avatar_url")
        );

        String token = jwtService.generateToken(user);
        String redirectUrl = oauthProperties.getFrontendCallbackUrl()
            + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
