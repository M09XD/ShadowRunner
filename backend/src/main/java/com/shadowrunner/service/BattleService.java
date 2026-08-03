package com.shadowrunner.service;

import com.shadowrunner.dto.BattleResultDTO;
import com.shadowrunner.entity.BattleLog;
import com.shadowrunner.repository.BattleLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class BattleService {
    
    private final BattleLogRepository battleLogRepository;
    private final AIService aiService;
    private final PlayerStatsService playerStatsService;

    // CRITICAL FIX #11: Add transaction isolation to prevent race conditions
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.SERIALIZABLE)
    public BattleResultDTO recordBattle(BattleResultDTO dto) {
        // Validate input
        if (dto == null || dto.getPlayerName() == null || dto.getPlayerName().isEmpty()) {
            log.warn("Invalid battle result: missing player name");
            throw new IllegalArgumentException("Player name is required");
        }
        if (dto.getLevelNumber() == null || dto.getLevelNumber() < 1 || dto.getLevelNumber() > 6) {
            log.warn("Invalid level number: {}", dto.getLevelNumber());
            throw new IllegalArgumentException("Invalid level number");
        }
        if (dto.getResult() == null || (!dto.getResult().equals("WIN") && !dto.getResult().equals("LOSS"))) {
            log.warn("Invalid battle result: {}", dto.getResult());
            throw new IllegalArgumentException("Result must be WIN or LOSS");
        }
        
        log.info("Recording battle for player: {} level: {} result: {}", 
            dto.getPlayerName(), dto.getLevelNumber(), dto.getResult());
        
        BattleLog battleLog = convertToEntity(dto);
        BattleLog saved = battleLogRepository.save(battleLog);
        
        // Update player stats atomically
        playerStatsService.updatePlayerStats(dto.getPlayerName(), dto.getLevelNumber(), 
            "WIN".equals(dto.getResult()));
        
        return convertToDTO(saved);
    }

    public List<BattleResultDTO> getPlayerBattles(String playerName) {
        if (playerName == null || playerName.isEmpty()) {
            log.warn("Invalid player name");
            throw new IllegalArgumentException("Player name is required");
        }
        log.debug("Fetching battles for player: {}", playerName);
        return battleLogRepository.findByPlayerName(playerName)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BattleResultDTO> getPlayerBattlesByLevel(String playerName, Integer levelNumber) {
        if (playerName == null || playerName.isEmpty()) {
            log.warn("Invalid player name");
            throw new IllegalArgumentException("Player name is required");
        }
        if (levelNumber == null || levelNumber < 1 || levelNumber > 6) {
            log.warn("Invalid level number: {}", levelNumber);
            throw new IllegalArgumentException("Invalid level number");
        }
        log.debug("Fetching battles for player: {} level: {}", playerName, levelNumber);
        return battleLogRepository.findByPlayerNameAndLevelNumber(playerName, levelNumber)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public Double getPlayerWinRate(String playerName) {
        if (playerName == null || playerName.isEmpty()) {
            log.warn("Invalid player name");
            throw new IllegalArgumentException("Player name is required");
        }
        log.debug("Calculating win rate for player: {}", playerName);
        List<BattleLog> battles = battleLogRepository.findByPlayerName(playerName);
        
        if (battles.isEmpty()) return 0.0;
        
        long wins = battles.stream()
            .filter(b -> "WIN".equals(b.getBattleResult()))
            .count();
        
        double winRate = (double) wins / battles.size() * 100;
        log.debug("Win rate for {}: {}", playerName, winRate);
        return winRate;
    }

    private BattleResultDTO convertToDTO(BattleLog entity) {
        return BattleResultDTO.builder()
            .playerName(entity.getPlayerName())
            .levelNumber(entity.getLevelNumber())
            .playerPokemonId(entity.getPlayerPokemonId())
            .playerPokemonName(entity.getPlayerPokemonName())
            .shadowPokemonId(entity.getShadowPokemonId())
            .shadowPokemonName(entity.getShadowPokemonName())
            .result(entity.getBattleResult())
            .battleLog(entity.getBattleLog())
            .battleDurationMs(entity.getBattleDurationMs())
            .build();
    }

    private BattleLog convertToEntity(BattleResultDTO dto) {
        return BattleLog.builder()
            .playerName(dto.getPlayerName())
            .levelNumber(dto.getLevelNumber())
            .playerPokemonId(dto.getPlayerPokemonId())
            .playerPokemonName(dto.getPlayerPokemonName())
            .shadowPokemonId(dto.getShadowPokemonId())
            .shadowPokemonName(dto.getShadowPokemonName())
            .battleResult(dto.getResult())
            .battleLog(dto.getBattleLog())
            .battleDurationMs(dto.getBattleDurationMs())
            .build();
    }
}
