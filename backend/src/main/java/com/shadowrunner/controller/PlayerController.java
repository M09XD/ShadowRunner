package com.shadowrunner.controller;

import com.shadowrunner.dto.PlayerStatsDTO;
import com.shadowrunner.service.PlayerStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/players")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class PlayerController {
    
    private static final Logger log = LoggerFactory.getLogger(PlayerController.class);
    
    private final PlayerStatsService playerStatsService;
    
    @Autowired
    public PlayerController(PlayerStatsService playerStatsService) {
        this.playerStatsService = playerStatsService;
    }

    @GetMapping("/{playerName}")
    public ResponseEntity<PlayerStatsDTO> getPlayerStats(@PathVariable String playerName) {
        log.info("GET /players/{}", playerName);
        try {
            PlayerStatsDTO stats = playerStatsService.getOrCreatePlayerStats(playerName);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching player stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{playerName}")
    public ResponseEntity<PlayerStatsDTO> createOrGetPlayer(@PathVariable String playerName) {
        log.info("POST /players/{}", playerName);
        try {
            PlayerStatsDTO stats = playerStatsService.getOrCreatePlayerStats(playerName);
            return ResponseEntity.status(HttpStatus.CREATED).body(stats);
        } catch (Exception e) {
            log.error("Error creating player: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{playerName}/skin/{skinId}")
    public ResponseEntity<PlayerStatsDTO> updateSkin(
            @PathVariable String playerName,
            @PathVariable Integer skinId) {
        log.info("PUT /players/{}/skin/{}", playerName, skinId);
        try {
            PlayerStatsDTO stats = playerStatsService.updateSkinSelection(playerName, skinId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error updating skin: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{playerName}/playtime/{playTimeMs}")
    public ResponseEntity<PlayerStatsDTO> updatePlayTime(
            @PathVariable String playerName,
            @PathVariable Long playTimeMs) {
        log.info("PUT /players/{}/playtime/{}", playerName, playTimeMs);
        try {
            PlayerStatsDTO stats = playerStatsService.updatePlayTime(playerName, playTimeMs);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error updating play time: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
