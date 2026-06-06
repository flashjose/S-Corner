package com.scorner.service;

import com.scorner.entity.OAuthAccount;
import com.scorner.entity.User;
import com.scorner.repository.OAuthAccountRepository;
import com.scorner.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       OAuthAccountRepository oauthAccountRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.oauthAccountRepository = oauthAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public Map<String, Object> register(String email, String password, String displayName) {
        String normalizedEmail = normalizeEmail(email);
        validateEmail(normalizedEmail);
        validatePassword(password);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already exists");
        }

        String name = (displayName != null && !displayName.isBlank())
            ? displayName.trim()
            : normalizedEmail.split("@")[0];

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(name);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return jwtService.authResponse(user, token);
    }

    public Map<String, Object> login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);
        return jwtService.authResponse(user, token);
    }

    @Transactional
    public User findOrCreateOAuthUser(String provider, String providerUserId,
                                      String email, String displayName, String avatarUrl) {
        Optional<OAuthAccount> existing = oauthAccountRepository
            .findByProviderAndProviderUserId(provider, providerUserId);
        if (existing.isPresent()) {
            User user = userRepository.findById(existing.get().getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            updateProfileIfNeeded(user, displayName, avatarUrl);
            return user;
        }

        User user = null;
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email.toLowerCase().trim()).orElse(null);
        }

        if (user == null) {
            user = new User();
            user.setEmail(email != null && !email.isBlank()
                ? email.toLowerCase().trim()
                : provider + "_" + providerUserId + "@oauth.local");
            user.setDisplayName(displayName != null && !displayName.isBlank()
                ? displayName.trim()
                : "User");
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
        } else {
            updateProfileIfNeeded(user, displayName, avatarUrl);
        }

        OAuthAccount account = new OAuthAccount();
        account.setUserId(user.getId());
        account.setProvider(provider);
        account.setProviderUserId(providerUserId);
        oauthAccountRepository.save(account);

        return user;
    }

    private void updateProfileIfNeeded(User user, String displayName, String avatarUrl) {
        boolean changed = false;
        if (displayName != null && !displayName.isBlank() && !displayName.equals(user.getDisplayName())) {
            user.setDisplayName(displayName.trim());
            changed = true;
        }
        if (avatarUrl != null && !avatarUrl.isBlank() && !avatarUrl.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(avatarUrl);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        return email.trim().toLowerCase();
    }

    private void validateEmail(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Invalid email format");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }
    }
}
