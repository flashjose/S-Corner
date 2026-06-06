package com.scorner.controller;

import com.scorner.config.OAuthProperties;
import com.scorner.service.AuthService;
import com.scorner.service.CurrentUserService;
import com.scorner.service.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;
    private final JwtService jwtService;
    private final OAuthProperties oauthProperties;

    public AuthController(AuthService authService,
                          CurrentUserService currentUserService,
                          JwtService jwtService,
                          OAuthProperties oauthProperties) {
        this.authService = authService;
        this.currentUserService = currentUserService;
        this.jwtService = jwtService;
        this.oauthProperties = oauthProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        Map<String, Object> result = authService.register(
            body.get("email"),
            body.get("password"),
            body.get("displayName")
        );
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        Map<String, Object> result = authService.login(
            body.get("email"),
            body.get("password")
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        var user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(jwtService.userToMap(user));
    }

    @GetMapping("/providers")
    public ResponseEntity<Map<String, Boolean>> providers() {
        return ResponseEntity.ok(Map.of("github", oauthProperties.getGithub().isEnabled()));
    }

    @GetMapping("/oauth/github")
    public void githubOAuth(HttpServletResponse response) throws IOException {
        if (!oauthProperties.getGithub().isEnabled()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "GitHub OAuth is not configured");
            return;
        }
        response.sendRedirect("/oauth2/authorization/github");
    }
}
