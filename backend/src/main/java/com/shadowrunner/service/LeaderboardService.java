package com.shadowrunner.service;

import com.shadowrunner.dto.LeaderboardEntryDTO;
import com.shadowrunner.entity.LeaderboardEntry;
import com.shadowrunner.repository.LeaderboardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class LeaderboardService {
    
    private final LeaderboardRepository leaderboardRepository;

    public LeaderboardEntryDTO submitScore(LeaderboardEntryDTO dto) {
        log.info("Submitting score for player: {} on level: {}", dto.getPlayerName(), dto.getLevelNumber());
        LeaderboardEntry entry = convertToEntity(dto);
        LeaderboardEntry saved = leaderboardRepository.save(entry);
        
        // Calculate and update ranking for all entries in this level
        updateRankingsForLevel(dto.getLevelNumber());
        
        // Reload the entry with updated ranking
        saved = leaderboardRepository.findById(saved.getId()).orElse(saved);
        return convertToDTO(saved);
    }
    
    private void updateRankingsForLevel(Integer levelNumber) {
        List<LeaderboardEntry> entries = leaderboardRepository.findByLevelNumberOrderByCompletionTimeMs(levelNumber);
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntry entry = entries.get(i);
            entry.setRanking(i + 1);
            leaderboardRepository.save(entry);
        }
    }

    public List<LeaderboardEntryDTO> getLeaderboardByLevel(Integer levelNumber) {
        log.info("Fetching leaderboard for level: {}", levelNumber);
        List<LeaderboardEntry> entries = leaderboardRepository.findByLevelNumberOrderByCompletionTimeMs(levelNumber);
        // Ensure rankings are up to date
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntry entry = entries.get(i);
            if (entry.getRanking() != i + 1) {
                entry.setRanking(i + 1);
                leaderboardRepository.save(entry);
            }
        }
        return entries.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDTO> getPlayerHistory(String playerName) {
        log.info("Fetching history for player: {}", playerName);
        return leaderboardRepository.findByPlayerNameOrderByCreatedAtDesc(playerName)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDTO> getGlobalTop() {
        log.info("Fetching global top leaderboard");
        return leaderboardRepository.findTopGlobal()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDTO> getTop10ByLevel(Integer levelNumber) {
        log.info("Fetching top 10 for level: {}", levelNumber);
        return leaderboardRepository.findTop10ByLevel(levelNumber)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private LeaderboardEntryDTO convertToDTO(LeaderboardEntry entity) {
        return LeaderboardEntryDTO.builder()
            .id(entity.getId())
            .playerName(entity.getPlayerName())
            .levelNumber(entity.getLevelNumber())
            .completionTimeMs(entity.getCompletionTimeMs())
            .ranking(entity.getRanking())
            .skinId(entity.getSkinId())
            .createdAt(entity.getCreatedAt())
            .build();
    }

    private LeaderboardEntry convertToEntity(LeaderboardEntryDTO dto) {
        return LeaderboardEntry.builder()
            .playerName(dto.getPlayerName())
            .levelNumber(dto.getLevelNumber())
            .completionTimeMs(dto.getCompletionTimeMs())
            .ranking(dto.getRanking())
            .skinId(dto.getSkinId())
            .build();
    }
}
