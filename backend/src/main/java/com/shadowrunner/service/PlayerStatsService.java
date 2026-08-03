package com.shadowrunner.service;

import com.shadowrunner.dto.PlayerStatsDTO;
import com.shadowrunner.entity.PlayerStats;
import com.shadowrunner.repository.PlayerStatsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
public class PlayerStatsService {

    private static final Logger log = LoggerFactory.getLogger(PlayerStatsService.class);
    
    private final PlayerStatsRepository playerStatsRepository;
    
    @Autowired
    public PlayerStatsService(PlayerStatsRepository playerStatsRepository) {
        this.playerStatsRepository = playerStatsRepository;
    }

    public PlayerStatsDTO getPlayerStats(String playerName) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(playerName);
        if (statsOpt.isEmpty()) {
            // Create default stats - CRITICAL FIX #7: Match entity fields
            PlayerStats defaultStats = new PlayerStats();
            defaultStats.setPlayerName(playerName);
            defaultStats.setCurrentLevel(1);
            defaultStats.setTotalWins(0);
            defaultStats.setTotalLosses(0);
            defaultStats.setSelectedSkinId(0);
            defaultStats.setTotalPlayTimeMs(0L);
            return convertToDTO(playerStatsRepository.save(defaultStats));
        }
        return convertToDTO(statsOpt.get());
    }

    @Transactional
    public PlayerStatsDTO getOrCreatePlayerStats(String playerName) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(playerName);
        if (statsOpt.isEmpty()) {
            // Create default stats
            PlayerStats defaultStats = new PlayerStats();
            defaultStats.setPlayerName(playerName);
            defaultStats.setCurrentLevel(1);
            defaultStats.setTotalWins(0);
            defaultStats.setTotalLosses(0);
            defaultStats.setSelectedSkinId(0);
            defaultStats.setTotalPlayTimeMs(0L);
            PlayerStats savedStats = playerStatsRepository.save(defaultStats);
            log.info("Created new player stats for: {}", playerName);
            return convertToDTO(savedStats);
        }
        return convertToDTO(statsOpt.get());
    }

    @Transactional
    public PlayerStatsDTO updateSkinSelection(String playerName, Integer skinId) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(playerName);
        PlayerStats stats;
        
        if (statsOpt.isEmpty()) {
            stats = new PlayerStats();
            stats.setPlayerName(playerName);
            stats.setCurrentLevel(1);
            stats.setTotalWins(0);
            stats.setTotalLosses(0);
            stats.setSelectedSkinId(skinId);
            stats.setTotalPlayTimeMs(0L);
        } else {
            stats = statsOpt.get();
            stats.setSelectedSkinId(skinId);
        }
        
        PlayerStats savedStats = playerStatsRepository.save(stats);
        log.info("Updated skin selection for player: {} to skinId: {}", playerName, skinId);
        return convertToDTO(savedStats);
    }

    @Transactional
    public PlayerStatsDTO updatePlayTime(String playerName, Long additionalTimeMs) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(playerName);
        PlayerStats stats;
        
        if (statsOpt.isEmpty()) {
            stats = new PlayerStats();
            stats.setPlayerName(playerName);
            stats.setCurrentLevel(1);
            stats.setTotalWins(0);
            stats.setTotalLosses(0);
            stats.setSelectedSkinId(0);
            stats.setTotalPlayTimeMs(additionalTimeMs);
        } else {
            stats = statsOpt.get();
            stats.setTotalPlayTimeMs(stats.getTotalPlayTimeMs() + additionalTimeMs);
        }
        
        PlayerStats savedStats = playerStatsRepository.save(stats);
        log.debug("Updated play time for player: {} by {}ms", playerName, additionalTimeMs);
        return convertToDTO(savedStats);
    }

    // CRITICAL FIX #6: Add method signature that BattleService expects
    @Transactional
    public void updatePlayerStats(String playerName, Integer levelNumber, boolean won) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(playerName);
        PlayerStats stats;

        if (statsOpt.isEmpty()) {
            stats = new PlayerStats();
            stats.setPlayerName(playerName);
            stats.setCurrentLevel(levelNumber);
            stats.setTotalWins(won ? 1 : 0);
            stats.setTotalLosses(won ? 0 : 1);
            stats.setSelectedSkinId(0);
            stats.setTotalPlayTimeMs(0L);
        } else {
            stats = statsOpt.get();
            stats.setCurrentLevel(Math.max(stats.getCurrentLevel(), levelNumber));
            if (won) {
                stats.setTotalWins(stats.getTotalWins() + 1);
            } else {
                stats.setTotalLosses(stats.getTotalLosses() + 1);
            }
        }

        playerStatsRepository.save(stats);
        log.debug("Updated stats for player: {} level: {} won: {}", playerName, levelNumber, won);
    }

    @Transactional
    public PlayerStatsDTO updatePlayerStats(PlayerStatsDTO dto) {
        Optional<PlayerStats> statsOpt = playerStatsRepository.findByPlayerName(dto.getPlayerName());
        PlayerStats stats;

        if (statsOpt.isEmpty()) {
            stats = new PlayerStats();
            stats.setPlayerName(dto.getPlayerName());
            stats.setCurrentLevel(dto.getCurrentLevel() != null ? dto.getCurrentLevel() : 1);
            stats.setTotalWins(dto.getTotalWins() != null ? dto.getTotalWins() : 0);
            stats.setTotalLosses(dto.getTotalLosses() != null ? dto.getTotalLosses() : 0);
            stats.setSelectedSkinId(dto.getSelectedSkinId() != null ? dto.getSelectedSkinId() : 0);
            stats.setTotalPlayTimeMs(dto.getTotalPlayTimeMs() != null ? dto.getTotalPlayTimeMs() : 0L);
        } else {
            stats = statsOpt.get();
            if (dto.getCurrentLevel() != null) stats.setCurrentLevel(Math.max(stats.getCurrentLevel(), dto.getCurrentLevel()));
            if (dto.getTotalWins() != null) stats.setTotalWins(dto.getTotalWins());
            if (dto.getTotalLosses() != null) stats.setTotalLosses(dto.getTotalLosses());
            if (dto.getSelectedSkinId() != null) stats.setSelectedSkinId(dto.getSelectedSkinId());
            if (dto.getTotalPlayTimeMs() != null) stats.setTotalPlayTimeMs(dto.getTotalPlayTimeMs());
        }

        return convertToDTO(playerStatsRepository.save(stats));
    }

    private PlayerStatsDTO convertToDTO(PlayerStats stats) {
        PlayerStatsDTO dto = new PlayerStatsDTO();
        dto.setId(stats.getId());
        dto.setPlayerName(stats.getPlayerName());
        dto.setCurrentLevel(stats.getCurrentLevel());
        dto.setTotalWins(stats.getTotalWins());
        dto.setTotalLosses(stats.getTotalLosses());
        dto.setSelectedSkinId(stats.getSelectedSkinId());
        dto.setTotalPlayTimeMs(stats.getTotalPlayTimeMs());
        return dto;
    }
}
