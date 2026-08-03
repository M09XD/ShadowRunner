package com.shadowrunner.controller;

import com.shadowrunner.dto.LeaderboardEntryDTO;
import com.shadowrunner.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class LeaderboardController {
    
    private final LeaderboardService leaderboardService;

    @PostMapping
    public ResponseEntity<LeaderboardEntryDTO> submitScore(@RequestBody LeaderboardEntryDTO dto) {
        log.info("POST /leaderboard - Player: {} Level: {}", dto.getPlayerName(), dto.getLevelNumber());
        try {
            LeaderboardEntryDTO entry = leaderboardService.submitScore(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(entry);
        } catch (Exception e) {
            log.error("Error submitting score: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/level/{levelNumber}")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboardByLevel(
            @PathVariable Integer levelNumber) {
        log.info("GET /leaderboard/level/{}", levelNumber);
        try {
            List<LeaderboardEntryDTO> leaderboard = leaderboardService.getLeaderboardByLevel(levelNumber);
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            log.error("Error fetching leaderboard: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/player/{playerName}")
    public ResponseEntity<List<LeaderboardEntryDTO>> getPlayerHistory(
            @PathVariable String playerName) {
        log.info("GET /leaderboard/player/{}", playerName);
        try {
            List<LeaderboardEntryDTO> history = leaderboardService.getPlayerHistory(playerName);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching player history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardEntryDTO>> getGlobalLeaderboard() {
        log.info("GET /leaderboard/global");
        try {
            List<LeaderboardEntryDTO> leaderboard = leaderboardService.getGlobalTop();
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            log.error("Error fetching global leaderboard: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/level/{levelNumber}/top10")
    public ResponseEntity<List<LeaderboardEntryDTO>> getTop10(
            @PathVariable Integer levelNumber) {
        log.info("GET /leaderboard/level/{}/top10", levelNumber);
        try {
            List<LeaderboardEntryDTO> top10 = leaderboardService.getTop10ByLevel(levelNumber);
            return ResponseEntity.ok(top10);
        } catch (Exception e) {
            log.error("Error fetching top 10: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
