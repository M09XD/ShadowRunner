package com.shadowrunner.service;

import com.shadowrunner.dto.LoginRequest;
import com.shadowrunner.dto.RegisterRequest;
import com.shadowrunner.dto.AuthResponse;
import com.shadowrunner.dto.PlayerStatsDTO;
import com.shadowrunner.entity.Account;
import com.shadowrunner.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.Optional;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {
    
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private PlayerStatsService playerStatsService;
    
    @Value("${jwt.secret:your-secret-key-change-this-in-production}")
    private String jwtSecret;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) throws Exception {
        // Validate input
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (!StringUtils.hasText(request.getPlayerName())) {
            throw new IllegalArgumentException("Player name is required");
        }
        
        // Check if email already exists
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        // Check if player name already exists
        if (accountRepository.existsByPlayerName(request.getPlayerName())) {
            throw new IllegalArgumentException("Player name already taken");
        }
        
        // Create new account
        Account account = new Account();
        account.setEmail(request.getEmail());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setPlayerName(request.getPlayerName());
        
        Account savedAccount = accountRepository.save(account);
        log.info("User registered successfully: {}", savedAccount.getEmail());
        
        // Create player stats automatically
        PlayerStatsDTO playerStats = playerStatsService.getOrCreatePlayerStats(savedAccount.getPlayerName());
        log.info("Created player stats for: {}", savedAccount.getPlayerName());
        
        return new AuthResponse(
                true,
                "Account created successfully",
                generateToken(savedAccount),
                savedAccount,
                playerStats
        );
    }
    
    public AuthResponse login(LoginRequest request) throws Exception {
        // Validate input
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Password is required");
        }
        
        // Find account by email
        Optional<Account> accountOpt = accountRepository.findByEmail(request.getEmail());
        if (accountOpt.isEmpty()) {
            log.warn("Login attempt with non-existent email: {}", request.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }
        
        Account account = accountOpt.get();
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            log.warn("Failed login attempt for user: {}", request.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }
        
        log.info("User logged in successfully: {}", account.getEmail());
        
        // Get player stats for the logged-in user
        PlayerStatsDTO playerStats = playerStatsService.getOrCreatePlayerStats(account.getPlayerName());
        
        return new AuthResponse(
                true,
                "Login successful",
                generateToken(account),
                account,
                playerStats
        );
    }
    
    // CRITICAL FIX #22: Simple token validation using Base64 encoding
    public AuthResponse validateToken(String token) throws Exception {
        if (!StringUtils.hasText(token)) {
            throw new IllegalArgumentException("Token is required");
        }
        
        try {
            // Decode token
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid token format");
            }
            
            Long accountId = Long.parseLong(parts[0]);
            Optional<Account> accountOpt = accountRepository.findById(accountId);
            
            if (accountOpt.isEmpty()) {
                throw new IllegalArgumentException("Account not found");
            }
            
            log.debug("Token validated successfully");
            
            return new AuthResponse(
                    true,
                    "Token is valid",
                    null,
                    accountOpt.get(),
                    null
            );
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getMessage());
            throw new IllegalArgumentException("Token validation failed: " + e.getMessage());
        }
    }
    
    // CRITICAL FIX #22: Simple token generation using Base64 encoding
    private String generateToken(Account account) {
        try {
            String tokenData = account.getId() + ":" + account.getEmail() + ":" + System.currentTimeMillis();
            return Base64.getEncoder().encodeToString(tokenData.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Token generation failed", e);
            throw new RuntimeException("Token generation failed: " + e.getMessage());
        }
    }
}
