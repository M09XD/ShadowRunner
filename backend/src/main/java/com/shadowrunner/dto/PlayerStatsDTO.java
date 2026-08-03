package com.shadowrunner.dto;

public class PlayerStatsDTO {
    private Long id;
    private String playerName;
    private Integer currentLevel;
    private Integer totalWins;
    private Integer totalLosses;
    private Integer selectedSkinId;
    private Long totalPlayTimeMs;
    
    public PlayerStatsDTO() {}
    
    public PlayerStatsDTO(Long id, String playerName, Integer currentLevel, Integer totalWins, 
                         Integer totalLosses, Integer selectedSkinId, Long totalPlayTimeMs) {
        this.id = id;
        this.playerName = playerName;
        this.currentLevel = currentLevel;
        this.totalWins = totalWins;
        this.totalLosses = totalLosses;
        this.selectedSkinId = selectedSkinId;
        this.totalPlayTimeMs = totalPlayTimeMs;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
    
    public Integer getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }
    
    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }
    
    public Integer getTotalLosses() { return totalLosses; }
    public void setTotalLosses(Integer totalLosses) { this.totalLosses = totalLosses; }
    
    public Integer getSelectedSkinId() { return selectedSkinId; }
    public void setSelectedSkinId(Integer selectedSkinId) { this.selectedSkinId = selectedSkinId; }
    
    public Long getTotalPlayTimeMs() { return totalPlayTimeMs; }
    public void setTotalPlayTimeMs(Long totalPlayTimeMs) { this.totalPlayTimeMs = totalPlayTimeMs; }
}
