package com.shadowrunner.controller;

import com.shadowrunner.dto.BattleResultDTO;
import com.shadowrunner.service.BattleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/battles")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class BattleController {
    
    private final BattleService battleService;

    @PostMapping
    public ResponseEntity<BattleResultDTO> recordBattle(@RequestBody BattleResultDTO dto) {
        log.info("POST /battles - Player: {} Result: {}", dto.getPlayerName(), dto.getResult());
        try {
            BattleResultDTO result = battleService.recordBattle(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            log.error("Error recording battle: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/player/{playerName}")
    public ResponseEntity<List<BattleResultDTO>> getPlayerBattles(@PathVariable String playerName) {
        log.info("GET /battles/player/{}", playerName);
        try {
            List<BattleResultDTO> battles = battleService.getPlayerBattles(playerName);
            return ResponseEntity.ok(battles);
        } catch (Exception e) {
            log.error("Error fetching battles: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/player/{playerName}/level/{levelNumber}")
    public ResponseEntity<List<BattleResultDTO>> getPlayerBattlesByLevel(
            @PathVariable String playerName,
            @PathVariable Integer levelNumber) {
        log.info("GET /battles/player/{}/level/{}", playerName, levelNumber);
        try {
            List<BattleResultDTO> battles = battleService.getPlayerBattlesByLevel(playerName, levelNumber);
            return ResponseEntity.ok(battles);
        } catch (Exception e) {
            log.error("Error fetching battles: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/player/{playerName}/winrate")
    public ResponseEntity<Double> getWinRate(@PathVariable String playerName) {
        log.info("GET /battles/player/{}/winrate", playerName);
        try {
            Double winRate = battleService.getPlayerWinRate(playerName);
            return ResponseEntity.ok(winRate);
        } catch (Exception e) {
            log.error("Error calculating win rate: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
