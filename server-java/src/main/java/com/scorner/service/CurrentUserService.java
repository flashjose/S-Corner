package com.scorner.service;

import com.scorner.entity.User;
import com.scorner.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<String> getCurrentUserIdOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }
        return Optional.of(jwt.getSubject());
    }

    public String getCurrentUserId() {
        return getCurrentUserIdOptional()
            .orElseThrow(() -> new RuntimeException("Unauthorized"));
    }

    public User getCurrentUser() {
        return userRepository.findById(getCurrentUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
