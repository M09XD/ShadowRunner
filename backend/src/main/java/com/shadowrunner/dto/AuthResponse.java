package com.shadowrunner.dto;

import com.shadowrunner.entity.Account;

public class AuthResponse {
    private boolean success;
    private String message;
    private String token;
    private Account account;
    private PlayerStatsDTO playerStats;
    
    public AuthResponse() {}
    
    public AuthResponse(boolean success, String message, String token, Account account, PlayerStatsDTO playerStats) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.account = account;
        this.playerStats = playerStats;
    }
    
    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
    
    public PlayerStatsDTO getPlayerStats() { return playerStats; }
    public void setPlayerStats(PlayerStatsDTO playerStats) { this.playerStats = playerStats; }
}
